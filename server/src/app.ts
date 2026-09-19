import { timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ADMIN_KEY } from './config.ts'
import {
  checkRateLimit,
  closeLfgPost,
  countHeroes,
  createLfgPost,
  getHeroDetail,
  getLfgPost,
  getLfgPostWithParticipants,
  getMeta,
  getUser,
  isUserParticipant,
  joinLfgPost,
  listHeroes,
  listLfgPosts,
  updateUserNickname,
  upsertUser,
} from './db.ts'
import { isSyncing, runSync } from './sync.ts'
import { generateToken } from './auth.ts'
import { exchangeCodeForSession } from './wechat.ts'
import { sendLfgJoinNotification } from './email.ts'
import { requireAuth, type AuthContext } from './middleware.ts'

export const app = new Hono<{ Variables: { auth: AuthContext } }>()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Admin-Key', 'Authorization'],
  })
)

function adminKeyOk(provided: string | undefined): boolean {
  if (!ADMIN_KEY || ADMIN_KEY === 'change-me') return false
  if (!provided) return false

  const left = Buffer.from(provided)
  const right = Buffer.from(ADMIN_KEY)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function cacheHeaders(syncedAt: string | null): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=300',
    'X-Synced-At': syncedAt || '',
  }
}

app.get('/api/health', (c) => {
  const syncedAt = getMeta('last_success_at')
  return c.json({
    ok: true,
    heroes: countHeroes(),
    synced_at: syncedAt,
    last_error: getMeta('last_error') || null,
    syncing: isSyncing(),
  })
})

app.get('/api/heroes', (c) => {
  const syncedAt = getMeta('last_success_at')
  const headers = cacheHeaders(syncedAt)
  for (const [key, value] of Object.entries(headers)) {
    c.header(key, value)
  }

  return c.json({
    heroes: listHeroes(),
    synced_at: syncedAt,
  })
})

app.get('/api/heroes/:shortName', (c) => {
  const shortName = c.req.param('shortName')
  const detail = getHeroDetail(shortName)

  if (!detail) {
    return c.json({ error: '英雄不存在' }, 404)
  }

  const syncedAt = getMeta('last_success_at')
  const headers = cacheHeaders(syncedAt)
  for (const [key, value] of Object.entries(headers)) {
    c.header(key, value)
  }

  return c.json({
    hero: detail.hero,
    abilities: detail.abilities,
    talents: detail.talents,
    synced_at: syncedAt,
  })
})

app.post('/api/admin/sync', async (c) => {
  if (!ADMIN_KEY || ADMIN_KEY === 'change-me') {
    return c.json({ error: 'ADMIN_KEY is not configured' }, 503)
  }

  if (!adminKeyOk(c.req.header('X-Admin-Key'))) {
    return c.json({ error: 'unauthorized' }, 401)
  }

  if (isSyncing()) {
    return c.json({ error: 'sync already running' }, 409)
  }

  const result = await runSync()
  return c.json(result, result.ok ? 200 : 500)
})

app.post('/api/auth/wechat', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { code } = body

  if (!code || typeof code !== 'string') {
    return c.json({ error: '缺少code参数' }, 400)
  }

  const session = await exchangeCodeForSession(code)
  
  if (!session) {
    return c.json({ error: '微信登录失败' }, 500)
  }

  upsertUser(session.openid, session.sessionKey)
  const token = generateToken(session.openid)
  const user = getUser(session.openid)

  return c.json({
    token,
    user: {
      openid: session.openid,
      nickname: user?.nickname || null,
    },
  })
})

app.get('/api/auth/me', requireAuth, (c) => {
  const { openid } = c.get('auth')
  const user = getUser(openid)

  if (!user) {
    return c.json({ error: '用户不存在' }, 404)
  }

  return c.json({
    openid: user.openid,
    nickname: user.nickname,
  })
})

app.post('/api/auth/nickname', requireAuth, async (c) => {
  const { openid } = c.get('auth')
  const body = await c.req.json().catch(() => ({}))
  const { nickname } = body

  if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
    return c.json({ error: '昵称不能为空' }, 400)
  }

  if (nickname.length > 20) {
    return c.json({ error: '昵称最多20个字符' }, 400)
  }

  updateUserNickname(openid, nickname.trim())

  return c.json({ ok: true })
})

app.get('/api/lfg', (c) => {
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Math.max(Number(c.req.query('offset')) || 0, 0)

  const posts = listLfgPosts('open', limit, offset)

  const formatted = posts.map((p) => ({
    id: p.id,
    mode: p.mode,
    party_size: p.party_size,
    note: p.note,
    owner_battlenet_id: p.owner_battlenet_id,
    owner_nickname: p.owner_nickname,
    participant_count: p.participant_count,
    status: p.status,
    created_at: p.created_at,
  }))

  return c.json({ posts: formatted })
})

app.get('/api/lfg/:id', (c) => {
  const id = Number(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: '无效的ID' }, 400)
  }

  const result = getLfgPostWithParticipants(id)

  if (!result) {
    return c.json({ error: '组队帖不存在' }, 404)
  }

  return c.json({
    post: {
      id: result.post.id,
      mode: result.post.mode,
      party_size: result.post.party_size,
      note: result.post.note,
      owner_battlenet_id: result.post.owner_battlenet_id,
      status: result.post.status,
      created_at: result.post.created_at,
    },
    participants: result.participants.map((p) => ({
      battlenet_id: p.battlenet_id,
      nickname: p.nickname,
      joined_at: p.joined_at,
    })),
  })
})

app.post('/api/lfg', requireAuth, async (c) => {
  const { openid } = c.get('auth')

  if (!checkRateLimit(openid, 'create_lfg', 5)) {
    return c.json({ error: '创建过于频繁，请稍后再试' }, 429)
  }

  const body = await c.req.json().catch(() => ({}))
  const { mode, party_size, note, battlenet_id, email } = body

  if (!mode || typeof mode !== 'string') {
    return c.json({ error: '缺少模式' }, 400)
  }

  if (!party_size || typeof party_size !== 'number' || party_size < 2 || party_size > 5) {
    return c.json({ error: '队伍人数必须在2-5人之间' }, 400)
  }

  if (!battlenet_id || typeof battlenet_id !== 'string' || battlenet_id.trim().length === 0) {
    return c.json({ error: '战网ID不能为空' }, 400)
  }

  if (email && typeof email === 'string' && email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return c.json({ error: '邮箱格式不正确' }, 400)
    }
  }

  const postId = createLfgPost({
    ownerOpenid: openid,
    mode: mode.trim(),
    partySize: party_size,
    note: note ? String(note).trim() : '',
    ownerBattlenetId: battlenet_id.trim(),
    ownerEmail: email ? String(email).trim() : undefined,
  })

  return c.json({ id: postId, ok: true })
})

app.post('/api/lfg/:id/join', requireAuth, async (c) => {
  const { openid } = c.get('auth')
  const id = Number(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: '无效的ID' }, 400)
  }

  if (!checkRateLimit(openid, 'join_lfg', 10)) {
    return c.json({ error: '加入过于频繁，请稍后再试' }, 429)
  }

  const post = getLfgPost(id)

  if (!post) {
    return c.json({ error: '组队帖不存在' }, 404)
  }

  if (post.status !== 'open') {
    return c.json({ error: '该组队帖已关闭' }, 400)
  }

  if (post.owner_openid === openid) {
    return c.json({ error: '不能加入自己的组队帖' }, 400)
  }

  if (isUserParticipant(id, openid)) {
    return c.json({ error: '你已经加入过了' }, 400)
  }

  const result = getLfgPostWithParticipants(id)
  if (result && result.participants.length >= post.party_size - 1) {
    return c.json({ error: '队伍已满' }, 400)
  }

  const body = await c.req.json().catch(() => ({}))
  const { battlenet_id, email } = body

  if (!battlenet_id || typeof battlenet_id !== 'string' || battlenet_id.trim().length === 0) {
    return c.json({ error: '战网ID不能为空' }, 400)
  }

  if (email && typeof email === 'string' && email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return c.json({ error: '邮箱格式不正确' }, 400)
    }
  }

  joinLfgPost(id, openid, battlenet_id.trim(), email ? String(email).trim() : undefined)

  if (post.owner_email) {
    sendLfgJoinNotification({
      posterEmail: post.owner_email,
      mode: post.mode,
      note: post.note || '',
      joinerBattlenetId: battlenet_id.trim(),
      lfgPostId: id,
    }).catch((err) => console.error('Email notification failed:', err))
  }

  return c.json({ ok: true })
})

app.post('/api/lfg/:id/close', requireAuth, (c) => {
  const { openid } = c.get('auth')
  const id = Number(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: '无效的ID' }, 400)
  }

  const success = closeLfgPost(id, openid)

  if (!success) {
    return c.json({ error: '无法关闭该组队帖' }, 403)
  }

  return c.json({ ok: true })
})

app.notFound((c) => c.json({ error: 'not found' }, 404))
