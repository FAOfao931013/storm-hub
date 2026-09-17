import type { Hero, HeroDetailResponse } from '@/types/hero'

const BASE_URL = 'https://api.fao13578.cn/api'
const COS_ASSET_BASE = 'https://mini-pro-1256180448.cos.ap-shanghai.myqcloud.com/storm-hub'

let heroesCache: Hero[] | null = null
let heroesCacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000

const detailCache = new Map<string, { data: HeroDetailResponse; ts: number }>()

function asHeroList(data: unknown): Hero[] {
  if (Array.isArray(data)) return data as Hero[]
  if (data && typeof data === 'object' && Array.isArray((data as { heroes?: unknown }).heroes)) {
    return (data as { heroes: Hero[] }).heroes
  }
  throw new Error('Invalid API response format')
}

/**
 * Extract Chinese name from translations array.
 * Prefer API-provided name_cn when present.
 */
export function getChineseName(translations: string[] | undefined, nameCn?: string): string {
  if (nameCn) return nameCn
  if (!Array.isArray(translations)) return ''

  const chineseEntry = translations.find((t) => t && /[\u4e00-\u9fff]/.test(t))
  return chineseEntry || ''
}

export function getHeroDisplayName(hero: Pick<Hero, 'name' | 'name_cn' | 'translations'>): string {
  return getChineseName(hero.translations, hero.name_cn) || hero.name
}

export async function fetchHeroes(options?: { force?: boolean }): Promise<Hero[]> {
  const now = Date.now()

  if (!options?.force && heroesCache && now - heroesCacheTimestamp < CACHE_TTL) {
    return heroesCache
  }

  try {
    const response = await uni.request({
      url: `${BASE_URL}/heroes`,
      method: 'GET',
      timeout: 10000,
    })

    if (response.statusCode === 200 && response.data) {
      heroesCache = asHeroList(response.data)
      heroesCacheTimestamp = now
      return heroesCache
    }

    throw new Error(`API returned status ${response.statusCode}`)
  } catch (error: any) {
    console.error('Failed to fetch heroes:', error)
    throw new Error(error.errMsg || error.message || '获取英雄列表失败')
  }
}

export async function fetchHeroDetail(
  shortName: string,
  options?: { force?: boolean }
): Promise<HeroDetailResponse> {
  const cacheKey = shortName.toLowerCase()
  const now = Date.now()
  const cached = detailCache.get(cacheKey)

  if (!options?.force && cached && now - cached.ts < CACHE_TTL) {
    return cached.data
  }

  try {
    const response = await uni.request({
      url: `${BASE_URL}/heroes/${encodeURIComponent(shortName)}`,
      method: 'GET',
      timeout: 10000,
    })

    if (response.statusCode === 404) {
      throw new Error('英雄不存在')
    }

    if (response.statusCode === 200 && response.data) {
      const payload = response.data as HeroDetailResponse
      if (!payload.hero) {
        throw new Error('Invalid API response format')
      }

      const data: HeroDetailResponse = {
        hero: payload.hero,
        abilities: Array.isArray(payload.abilities) ? payload.abilities : [],
        talents: Array.isArray(payload.talents) ? payload.talents : [],
        synced_at: payload.synced_at ?? null,
      }

      detailCache.set(cacheKey, { data, ts: now })
      return data
    }

    throw new Error(`API returned status ${response.statusCode}`)
  } catch (error: any) {
    console.error('Failed to fetch hero detail:', error)
    throw new Error(error.errMsg || error.message || '获取英雄详情失败')
  }
}

export function getHeroIconUrl(shortName: string): string {
  return `${COS_ASSET_BASE}/heroes/${shortName.toLowerCase()}.png`
}

export function getTalentIconUrl(iconFilename: string): string {
  if (!iconFilename) return ''
  const name = iconFilename.replace(/\.(png|jpg|jpeg)$/i, '')
  return `${COS_ASSET_BASE}/talents/${name}.png`
}

export function getAbilityIconUrl(iconFilename: string): string {
  if (!iconFilename) return ''
  const name = iconFilename.replace(/\.(png|jpg|jpeg)$/i, '')
  return `${COS_ASSET_BASE}/talents/${name}.png`
}

export function clearHeroesCache(): void {
  heroesCache = null
  heroesCacheTimestamp = 0
}

export function clearHeroDetailCache(shortName?: string): void {
  if (shortName) {
    detailCache.delete(shortName.toLowerCase())
    return
  }
  detailCache.clear()
}
