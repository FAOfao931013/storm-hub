import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { DB_PATH } from './config.ts'
import { getChineseName } from './names.ts'
import type { Ability, Hero, Talent } from './types.ts'

mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS heroes (
    short_name TEXT PRIMARY KEY,
    id INTEGER,
    name TEXT NOT NULL,
    attribute_id TEXT,
    role TEXT,
    new_role TEXT,
    type TEXT,
    franchise TEXT,
    name_cn TEXT,
    translations_json TEXT NOT NULL,
    release_date TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hero_details (
    short_name TEXT PRIMARY KEY,
    abilities_json TEXT NOT NULL,
    talents_json TEXT NOT NULL,
    build TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT UNIQUE NOT NULL,
    session_key TEXT,
    nickname TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lfg_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_openid TEXT NOT NULL,
    mode TEXT NOT NULL,
    party_size INTEGER NOT NULL,
    note TEXT,
    owner_battlenet_id TEXT NOT NULL,
    owner_email TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (owner_openid) REFERENCES users(openid)
  );

  CREATE TABLE IF NOT EXISTS lfg_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lfg_post_id INTEGER NOT NULL,
    openid TEXT NOT NULL,
    battlenet_id TEXT NOT NULL,
    email TEXT,
    joined_at TEXT NOT NULL,
    FOREIGN KEY (lfg_post_id) REFERENCES lfg_posts(id),
    UNIQUE(lfg_post_id, openid)
  );

  CREATE TABLE IF NOT EXISTS lfg_rate_limit (
    openid TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    window_start TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_lfg_posts_status ON lfg_posts(status);
  CREATE INDEX IF NOT EXISTS idx_lfg_posts_created ON lfg_posts(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_lfg_participants_post ON lfg_participants(lfg_post_id);
`)

type HeroRow = {
  short_name: string
  id: number | null
  name: string
  attribute_id: string | null
  role: string | null
  new_role: string | null
  type: string | null
  franchise: string | null
  name_cn: string | null
  translations_json: string
  release_date: string | null
}

type DetailRow = {
  short_name: string
  abilities_json: string
  talents_json: string
  build: string | null
}

function parseTranslations(raw: string): string[] {
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function rowToHero(row: HeroRow): Hero {
  const translations = parseTranslations(row.translations_json)
  const id = row.id ?? 0

  return {
    id,
    name: row.name,
    short_name: row.short_name,
    attribute_id: row.attribute_id || '',
    role: row.role || '',
    new_role: row.new_role || '',
    type: row.type || '',
    release_date: row.release_date || undefined,
    translations,
    franchise: row.franchise || 'Nexus',
    name_cn: getChineseName(translations, id) || row.name_cn || '',
  }
}

export function getMeta(key: string): string | null {
  const row = db
    .prepare('SELECT value FROM sync_meta WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setMeta(key: string, value: string): void {
  db.prepare(
    `INSERT INTO sync_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value)
}

export function countHeroes(): number {
  const row = db.prepare('SELECT COUNT(*) AS count FROM heroes').get() as {
    count: number
  }
  return row.count
}

export function listHeroes(): Hero[] {
  const rows = db
    .prepare(
      `SELECT short_name, id, name, attribute_id, role, new_role, type,
              franchise, name_cn, translations_json, release_date
       FROM heroes
       ORDER BY id ASC`
    )
    .all() as HeroRow[]

  return rows.map(rowToHero)
}

export function getHero(shortName: string): Hero | null {
  const row = db
    .prepare(
      `SELECT short_name, id, name, attribute_id, role, new_role, type,
              franchise, name_cn, translations_json, release_date
       FROM heroes
       WHERE lower(short_name) = lower(?)`
    )
    .get(shortName) as HeroRow | undefined

  return row ? rowToHero(row) : null
}

export function getHeroDetail(shortName: string): {
  hero: Hero
  abilities: Ability[]
  talents: Talent[]
  build: string | null
} | null {
  const hero = getHero(shortName)
  if (!hero) return null

  const detail = db
    .prepare(
      `SELECT short_name, abilities_json, talents_json, build
       FROM hero_details
       WHERE lower(short_name) = lower(?)`
    )
    .get(hero.short_name) as DetailRow | undefined

  return {
    hero,
    abilities: detail ? (JSON.parse(detail.abilities_json) as Ability[]) : [],
    talents: detail ? (JSON.parse(detail.talents_json) as Talent[]) : [],
    build: detail?.build ?? null,
  }
}

export function replaceAllHeroes(
  heroes: Array<Hero & { abilities: Ability[]; talents: Talent[]; build: string }>
): void {
  const upsertHero = db.prepare(`
    INSERT INTO heroes (
      short_name, id, name, attribute_id, role, new_role, type,
      franchise, name_cn, translations_json, release_date, updated_at
    ) VALUES (
      @short_name, @id, @name, @attribute_id, @role, @new_role, @type,
      @franchise, @name_cn, @translations_json, @release_date, @updated_at
    )
    ON CONFLICT(short_name) DO UPDATE SET
      id = excluded.id,
      name = excluded.name,
      attribute_id = excluded.attribute_id,
      role = excluded.role,
      new_role = excluded.new_role,
      type = excluded.type,
      franchise = excluded.franchise,
      name_cn = excluded.name_cn,
      translations_json = excluded.translations_json,
      release_date = excluded.release_date,
      updated_at = excluded.updated_at
  `)

  const upsertDetail = db.prepare(`
    INSERT INTO hero_details (
      short_name, abilities_json, talents_json, build, updated_at
    ) VALUES (
      @short_name, @abilities_json, @talents_json, @build, @updated_at
    )
    ON CONFLICT(short_name) DO UPDATE SET
      abilities_json = excluded.abilities_json,
      talents_json = excluded.talents_json,
      build = excluded.build,
      updated_at = excluded.updated_at
  `)

  const now = new Date().toISOString()

  const tx = db.transaction(() => {
    for (const hero of heroes) {
      upsertHero.run({
        short_name: hero.short_name,
        id: hero.id,
        name: hero.name,
        attribute_id: hero.attribute_id,
        role: hero.role,
        new_role: hero.new_role,
        type: hero.type,
        franchise: hero.franchise || 'Nexus',
        name_cn: hero.name_cn || '',
        translations_json: JSON.stringify(hero.translations || []),
        release_date: hero.release_date || null,
        updated_at: now,
      })

      upsertDetail.run({
        short_name: hero.short_name,
        abilities_json: JSON.stringify(hero.abilities),
        talents_json: JSON.stringify(hero.talents),
        build: hero.build,
        updated_at: now,
      })
    }
  })

  tx()
}

export function upsertUser(openid: string, sessionKey: string, nickname?: string) {
  const now = new Date().toISOString()
  const stmt = db.prepare(`
    INSERT INTO users (openid, session_key, nickname, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(openid) DO UPDATE SET
      session_key = excluded.session_key,
      nickname = COALESCE(excluded.nickname, nickname),
      updated_at = excluded.updated_at
  `)
  stmt.run(openid, sessionKey, nickname || null, now, now)
}

export function getUser(openid: string) {
  return db.prepare('SELECT * FROM users WHERE openid = ?').get(openid) as {
    id: number
    openid: string
    session_key: string | null
    nickname: string | null
    created_at: string
    updated_at: string
  } | undefined
}

export function updateUserNickname(openid: string, nickname: string) {
  const now = new Date().toISOString()
  db.prepare('UPDATE users SET nickname = ?, updated_at = ? WHERE openid = ?').run(
    nickname,
    now,
    openid
  )
}

export function createLfgPost(data: {
  ownerOpenid: string
  mode: string
  partySize: number
  note: string
  ownerBattlenetId: string
  ownerEmail?: string
}) {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO lfg_posts 
      (owner_openid, mode, party_size, note, owner_battlenet_id, owner_email, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`
    )
    .run(
      data.ownerOpenid,
      data.mode,
      data.partySize,
      data.note,
      data.ownerBattlenetId,
      data.ownerEmail || null,
      now,
      now
    )
  return result.lastInsertRowid as number
}

export function getLfgPost(id: number) {
  return db.prepare('SELECT * FROM lfg_posts WHERE id = ?').get(id) as
    | {
        id: number
        owner_openid: string
        mode: string
        party_size: number
        note: string | null
        owner_battlenet_id: string
        owner_email: string | null
        status: string
        created_at: string
        updated_at: string
      }
    | undefined
}

export function listLfgPosts(status = 'open', limit = 50, offset = 0) {
  return db
    .prepare(
      `SELECT 
        l.*,
        (SELECT COUNT(*) FROM lfg_participants WHERE lfg_post_id = l.id) as participant_count,
        u.nickname as owner_nickname
      FROM lfg_posts l
      LEFT JOIN users u ON l.owner_openid = u.openid
      WHERE l.status = ?
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?`
    )
    .all(status, limit, offset) as Array<{
    id: number
    owner_openid: string
    mode: string
    party_size: number
    note: string | null
    owner_battlenet_id: string
    owner_email: string | null
    status: string
    created_at: string
    updated_at: string
    participant_count: number
    owner_nickname: string | null
  }>
}

export function getLfgPostWithParticipants(id: number) {
  const post = getLfgPost(id)
  if (!post) return null

  const participants = db
    .prepare(
      `SELECT 
        p.id, p.battlenet_id, p.joined_at,
        u.nickname
      FROM lfg_participants p
      LEFT JOIN users u ON p.openid = u.openid
      WHERE p.lfg_post_id = ?
      ORDER BY p.joined_at ASC`
    )
    .all(id) as Array<{
    id: number
    battlenet_id: string
    joined_at: string
    nickname: string | null
  }>

  return { post, participants }
}

export function joinLfgPost(lfgPostId: number, openid: string, battlenetId: string, email?: string) {
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO lfg_participants (lfg_post_id, openid, battlenet_id, email, joined_at)
    VALUES (?, ?, ?, ?, ?)`
  ).run(lfgPostId, openid, battlenetId, email || null, now)
}

export function closeLfgPost(id: number, ownerOpenid: string) {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `UPDATE lfg_posts SET status = 'closed', updated_at = ?
      WHERE id = ? AND owner_openid = ? AND status = 'open'`
    )
    .run(now, id, ownerOpenid)
  return result.changes > 0
}

export function checkRateLimit(openid: string, actionType: string, maxPerHour: number): boolean {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()

  const existing = db
    .prepare(
      'SELECT count, window_start FROM lfg_rate_limit WHERE openid = ? AND action_type = ?'
    )
    .get(openid, actionType) as { count: number; window_start: string } | undefined

  if (!existing) {
    db.prepare(
      'INSERT INTO lfg_rate_limit (openid, action_type, count, window_start) VALUES (?, ?, 1, ?)'
    ).run(openid, actionType, now.toISOString())
    return true
  }

  if (existing.window_start < oneHourAgo) {
    db.prepare(
      'UPDATE lfg_rate_limit SET count = 1, window_start = ? WHERE openid = ? AND action_type = ?'
    ).run(now.toISOString(), openid, actionType)
    return true
  }

  if (existing.count >= maxPerHour) {
    return false
  }

  db.prepare(
    'UPDATE lfg_rate_limit SET count = count + 1 WHERE openid = ? AND action_type = ?'
  ).run(openid, actionType)
  return true
}

export function isUserParticipant(lfgPostId: number, openid: string): boolean {
  const result = db
    .prepare('SELECT 1 FROM lfg_participants WHERE lfg_post_id = ? AND openid = ?')
    .get(lfgPostId, openid)
  return !!result
}
