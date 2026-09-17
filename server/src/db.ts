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
