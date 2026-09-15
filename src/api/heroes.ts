import type { Hero, Talent, Ability } from '@/types/hero'

const BASE_URL = 'https://api.heroesprofile.com/openApi'
const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/gh/heroespatchnotes/heroes-talents@master'

// Cache for heroes list (in-memory)
let heroesCache: Hero[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Extract Chinese name from translations array
 * Looks for CJK characters (Chinese simplified/traditional)
 * Returns first Chinese match or empty string
 */
export function getChineseName(translations: string[]): string {
  if (!Array.isArray(translations)) return ''
  
  // Find first string containing CJK characters (Chinese)
  const chineseEntry = translations.find(t => 
    t && /[\u4e00-\u9fff]/.test(t)
  )
  
  return chineseEntry || ''
}

/**
 * Fetch all heroes from Heroes Profile API
 * API returns an object keyed by hero name, not an array
 */
export async function fetchHeroes(): Promise<Hero[]> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (heroesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return heroesCache
  }

  try {
    const response = await uni.request({
      url: `${BASE_URL}/Heroes`,
      method: 'GET',
      timeout: 10000
    })

    if (response.statusCode === 200 && response.data) {
      const data = response.data as any
      
      // Convert object to array
      if (typeof data === 'object' && !Array.isArray(data)) {
        // API returns { "Abathur": {...}, "Alarak": {...} }
        heroesCache = Object.values(data) as Hero[]
      } else if (Array.isArray(data)) {
        // Fallback if API changes to array format
        heroesCache = data as Hero[]
      } else {
        throw new Error('Invalid API response format')
      }
      
      cacheTimestamp = now
      return heroesCache
    }
    
    throw new Error(`API returned status ${response.statusCode}`)
  } catch (error: any) {
    console.error('Failed to fetch heroes:', error)
    throw new Error(error.errMsg || '获取英雄列表失败')
  }
}

/**
 * Fetch hero talents from Heroes Profile API
 */
export async function fetchTalents(heroName?: string): Promise<Talent[]> {
  try {
    const url = heroName 
      ? `${BASE_URL}/Heroes/Talents?hero=${encodeURIComponent(heroName)}`
      : `${BASE_URL}/Heroes/Talents`

    const response = await uni.request({
      url,
      method: 'GET',
      timeout: 10000
    })

    if (response.statusCode === 200 && Array.isArray(response.data)) {
      return response.data as Talent[]
    }
    
    throw new Error(`API returned status ${response.statusCode}`)
  } catch (error: any) {
    console.error('Failed to fetch talents:', error)
    throw new Error(error.errMsg || '获取天赋数据失败')
  }
}

/**
 * Fetch hero abilities from jsDelivr heroes-talents repo
 * Fallback if openApi doesn't provide full ability kits
 */
export async function fetchAbilities(heroShortName: string): Promise<Ability[]> {
  try {
    // Try fetching from heroes-talents JSON structure
    const url = `${JSDELIVR_BASE}/hero/${heroShortName.toLowerCase()}/data.json`
    
    const response = await uni.request({
      url,
      method: 'GET',
      timeout: 10000
    })

    if (response.statusCode === 200 && response.data) {
      const data: any = response.data
      // Parse abilities from the JSON structure
      const abilities: Ability[] = []
      
      if (data.abilities) {
        for (const key in data.abilities) {
          const ability = data.abilities[key]
          abilities.push({
            owner: heroShortName,
            name: ability.name || key,
            title: ability.name || key,
            description: ability.description || '',
            icon: ability.icon || '',
            hotkey: ability.hotkey || key.toUpperCase(),
            cooldown: ability.cooldown,
            mana_cost: ability.manaCost,
            trait: ability.trait || false
          })
        }
      }
      
      return abilities
    }
    
    // Return empty array if not found (not all heroes may have data)
    return []
  } catch (error: any) {
    console.warn(`Failed to fetch abilities for ${heroShortName}:`, error)
    // Don't throw error, just return empty array as fallback
    return []
  }
}

/**
 * Get hero icon URL from jsDelivr
 */
export function getHeroIconUrl(shortName: string): string {
  // Try common paths for hero portraits
  return `${JSDELIVR_BASE}/images/heroes/${shortName.toLowerCase()}.png`
}

/**
 * Get talent icon URL from jsDelivr
 */
export function getTalentIconUrl(iconFilename: string): string {
  if (!iconFilename) return ''
  // Remove any extension and use consistent path
  const name = iconFilename.replace(/\.(png|jpg|jpeg)$/i, '')
  return `${JSDELIVR_BASE}/images/talents/${name}.png`
}

/**
 * Get ability icon URL from jsDelivr
 */
export function getAbilityIconUrl(iconFilename: string): string {
  if (!iconFilename) return ''
  const name = iconFilename.replace(/\.(png|jpg|jpeg)$/i, '')
  return `${JSDELIVR_BASE}/images/abilities/${name}.png`
}

/**
 * Clear heroes cache (useful for pull-to-refresh)
 */
export function clearHeroesCache(): void {
  heroesCache = null
  cacheTimestamp = 0
}
