import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { HEROES_PROFILE_BASE, JSDELIVR_HERO_BASE, USER_AGENT, ZHCN_DIR } from './config.ts'
import { countHeroes, replaceAllHeroes, setMeta } from './db.ts'
import { getFranchise } from './franchise.ts'
import type { Ability, Hero, SyncResult, Talent, ZhcnHeroData } from './types.ts'
import { mergeZhcnAbilities, mergeZhcnTalents } from './zhcn.ts'

let syncing = false

export function isSyncing(): boolean {
  return syncing
}

export function hasHeroData(): boolean {
  return countHeroes() > 0
}

function getChineseName(translations: string[]): string {
  if (!Array.isArray(translations)) return ''
  const chineseEntry = translations.find((t) => t && /[\u4e00-\u9fff]/.test(t))
  return chineseEntry || ''
}

async function fetchJson(url: string, timeoutMs = 20000): Promise<unknown> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  return response.json()
}

function asHeroList(data: unknown): Hero[] {
  let values: unknown[] = []

  if (Array.isArray(data)) {
    values = data
  } else if (data && typeof data === 'object') {
    values = Object.values(data as Record<string, unknown>)
  } else {
    throw new Error('Heroes API returned an unexpected payload')
  }

  return values
    .map((raw) => {
      const item = raw as Record<string, unknown>
      const shortName = String(item.short_name || '').trim()
      if (!shortName) return null

      const translations = Array.isArray(item.translations)
        ? item.translations.filter((entry): entry is string => typeof entry === 'string')
        : []

      const hero: Hero = {
        id: Number(item.id) || 0,
        name: String(item.name || ''),
        short_name: shortName,
        attribute_id: String(item.attribute_id || ''),
        role: String(item.role || ''),
        new_role: String(item.new_role || item.role || ''),
        type: String(item.type || ''),
        release_date: item.release_date ? String(item.release_date) : undefined,
        translations,
        name_cn: getChineseName(translations),
        franchise: getFranchise(shortName, String(item.attribute_id || '')),
      }

      return hero
    })
    .filter((hero): hero is Hero => Boolean(hero))
}

function normalizeTalents(raw: unknown): Talent[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item) => {
    const t = item as Record<string, unknown>
    return {
      name: String(t.talent_name || t.name || ''),
      title: String(t.title || t.talent_name || t.name || ''),
      description: String(t.description || ''),
      icon: String(t.icon || ''),
      icon_url:
        t.icon_url && typeof t.icon_url === 'object'
          ? (t.icon_url as Record<string, string>)
          : undefined,
      level: parseInt(String(t.level), 10) || 0,
      sort: parseInt(String(t.sort), 10) || 0,
    }
  })
}

function findHeroTalents(
  talentsMap: Record<string, unknown>,
  hero: Hero
): Talent[] {
  const direct = talentsMap[hero.name] ?? talentsMap[hero.short_name]
  if (direct) return normalizeTalents(direct)

  const lowerName = hero.name.toLowerCase()
  const lowerShort = hero.short_name.toLowerCase()
  for (const [key, value] of Object.entries(talentsMap)) {
    if (key.toLowerCase() === lowerName || key.toLowerCase() === lowerShort) {
      return normalizeTalents(value)
    }
  }

  return []
}

function parseAbilities(data: unknown): Ability[] {
  const payload = data as { abilities?: Record<string, unknown> }
  if (!payload?.abilities || typeof payload.abilities !== 'object') return []

  const abilities: Ability[] = []

  for (const [ownerKey, ownerAbilities] of Object.entries(payload.abilities)) {
    if (!Array.isArray(ownerAbilities)) continue

    for (const ability of ownerAbilities) {
      const item = ability as Record<string, unknown>
      if (item.type === 'mount') continue

      abilities.push({
        owner: ownerKey,
        name: String(item.name || item.abilityId || ''),
        title: String(item.name || ''),
        description: String(item.description || ''),
        icon: String(item.icon || ''),
        hotkey: item.hotkey ? String(item.hotkey) : undefined,
        cooldown: typeof item.cooldown === 'number' ? item.cooldown : undefined,
        mana_cost: typeof item.manaCost === 'number' ? item.manaCost : undefined,
        trait: Boolean(item.trait),
      })
    }
  }

  const order = ['D', 'Q', 'W', 'E', 'R', 'R2']
  abilities.sort((a, b) => {
    if (a.trait && !b.trait) return -1
    if (!a.trait && b.trait) return 1

    const aIndex = order.indexOf(a.hotkey || '')
    const bIndex = order.indexOf(b.hotkey || '')
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return 0
  })

  return abilities
}

const ABILITY_FILE_ALIASES: Record<string, string[]> = {
  cho: ['chogall', 'cho'],
  gall: ['gall', 'chogall'],
  thelostvikings: ['lostvikings', 'thelostvikings', 'tlv'],
}

function abilityFileCandidates(shortName: string): string[] {
  const lower = shortName.toLowerCase()
  const aliases = ABILITY_FILE_ALIASES[lower] || [lower]
  return [...new Set(aliases)]
}

function readZhcn(shortName: string): ZhcnHeroData | null {
  const filePath = join(ZHCN_DIR, `${shortName.toLowerCase()}.json`)
  if (!existsSync(filePath)) return null

  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as ZhcnHeroData
  } catch (error) {
    console.warn(`[sync] failed to parse zhcn for ${shortName}:`, error)
    return null
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index], index)
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  )
  await Promise.all(workers)
  return results
}

export async function runSync(): Promise<SyncResult> {
  if (syncing) {
    return {
      ok: false,
      heroes: countHeroes(),
      details: 0,
      failed: [],
      error: 'sync already running',
      synced_at: new Date().toISOString(),
    }
  }

  syncing = true
  const startedAt = new Date().toISOString()
  setMeta('last_started_at', startedAt)

  try {
    console.log('[sync] fetching heroes list')
    const heroesPayload = await fetchJson(`${HEROES_PROFILE_BASE}/Heroes`)
    const heroes = asHeroList(heroesPayload)
    if (heroes.length === 0) {
      throw new Error('Heroes API returned 0 heroes')
    }

    console.log(`[sync] fetching talents (${heroes.length} heroes)`)
    const talentsPayload = await fetchJson(`${HEROES_PROFILE_BASE}/Heroes/Talents`, 45000)
    const talentsMap =
      talentsPayload && typeof talentsPayload === 'object' && !Array.isArray(talentsPayload)
        ? (talentsPayload as Record<string, unknown>)
        : {}

    const failed: string[] = []

    const prepared = await mapPool(heroes, 5, async (hero) => {
      try {
        const talents = findHeroTalents(talentsMap, hero)
        let abilities: Ability[] = []

        const abilityFiles = abilityFileCandidates(hero.short_name)
        let abilitiesLoaded = false
        for (const fileName of abilityFiles) {
          try {
            const abilityPayload = await fetchJson(
              `${JSDELIVR_HERO_BASE}/${fileName}.json`
            )
            abilities = parseAbilities(abilityPayload)
            abilitiesLoaded = true
            break
          } catch {
            // try next filename
          }
        }
        if (!abilitiesLoaded) {
          console.warn(`[sync] abilities missing for ${hero.short_name}`)
        }

        const zhcn = readZhcn(hero.short_name)

        return {
          ...hero,
          abilities: mergeZhcnAbilities(abilities, zhcn),
          talents: mergeZhcnTalents(talents, zhcn),
          build: zhcn?.build || '',
        }
      } catch (error) {
        failed.push(hero.short_name)
        console.warn(`[sync] skipped ${hero.short_name}:`, error)
        return null
      }
    })

    const successful = prepared.filter(
      (item): item is NonNullable<typeof item> => Boolean(item)
    )

    if (successful.length === 0) {
      throw new Error('sync produced 0 heroes')
    }

    replaceAllHeroes(successful)

    const syncedAt = new Date().toISOString()
    setMeta('last_success_at', syncedAt)
    setMeta('last_error', '')
    setMeta('last_failed', JSON.stringify(failed))
    setMeta('hero_count', String(successful.length))

    console.log(
      `[sync] done: ${successful.length} heroes, ${failed.length} failed`
    )

    return {
      ok: true,
      heroes: successful.length,
      details: successful.length,
      failed,
      synced_at: syncedAt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setMeta('last_error', message)
    console.error('[sync] failed:', message)

    return {
      ok: false,
      heroes: countHeroes(),
      details: 0,
      failed: [],
      error: message,
      synced_at: new Date().toISOString(),
    }
  } finally {
    syncing = false
  }
}
