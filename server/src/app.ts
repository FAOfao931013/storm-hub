import { timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ADMIN_KEY } from './config.ts'
import { countHeroes, getHeroDetail, getMeta, listHeroes } from './db.ts'
import { isSyncing, runSync } from './sync.ts'

export const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Admin-Key'],
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

app.notFound((c) => c.json({ error: 'not found' }, 404))
