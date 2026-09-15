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
 * API returns object keyed by hero name: {"Abathur": [...]}
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

    if (response.statusCode === 200 && response.data) {
      const data = response.data as any
      
      // API returns object keyed by hero name: {"Abathur": [...], "Alarak": [...]}
      let talentArray: any[] = []
      
      if (Array.isArray(data)) {
        // Fallback if API returns array
        talentArray = data
      } else if (typeof data === 'object') {
        // Convert object to array - if heroName specified, get that hero's talents
        if (heroName && data[heroName]) {
          talentArray = data[heroName]
        } else {
          // Flatten all heroes' talents
          talentArray = Object.values(data).flat()
        }
      }
      
      // Normalize talent fields to match our interface
      return talentArray.map((t: any) => ({
        name: t.talent_name || t.name || '',
        title: t.title || t.talent_name || '',
        description: t.description || '',
        icon: t.icon || '',
        icon_url: t.icon_url,
        level: parseInt(String(t.level), 10) || 0,
        sort: parseInt(String(t.sort), 10) || 0
      }))
    }
    
    throw new Error(`API returned status ${response.statusCode}`)
  } catch (error: any) {
    console.error('Failed to fetch talents:', error)
    throw new Error(error.errMsg || '获取天赋数据失败')
  }
}

/**
 * Fetch hero abilities from jsDelivr heroes-talents repo
 * Correct path: hero/{shortname}.json (not hero/{shortname}/data.json)
 * Abilities are nested by owner: {"Abathur": [...], "AbathurSymbiote": [...]}
 */
export async function fetchAbilities(heroShortName: string): Promise<Ability[]> {
  try {
    // Correct path: hero/abathur.json
    const url = `${JSDELIVR_BASE}/hero/${heroShortName.toLowerCase()}.json`
    
    const response = await uni.request({
      url,
      method: 'GET',
      timeout: 10000
    })

    if (response.statusCode === 200 && response.data) {
      const data: any = response.data
      const abilities: Ability[] = []
      
      // Abilities are nested by owner key (e.g., "Abathur", "AbathurSymbiote")
      if (data.abilities && typeof data.abilities === 'object') {
        for (const ownerKey in data.abilities) {
          const ownerAbilities = data.abilities[ownerKey]
          
          if (Array.isArray(ownerAbilities)) {
            ownerAbilities.forEach((ability: any) => {
              // Include basic abilities, heroics, and traits
              // Skip mount abilities (type === 'mount')
              if (ability.type !== 'mount') {
                abilities.push({
                  owner: ownerKey,
                  name: ability.name || ability.abilityId || '',
                  title: ability.name || '',
                  description: ability.description || '',
                  icon: ability.icon || '',
                  hotkey: ability.hotkey || '',
                  cooldown: ability.cooldown,
                  mana_cost: ability.manaCost,
                  trait: ability.trait || false
                })
              }
            })
          }
        }
      }
      
      // Sort: trait first, then basic (Q/W/E), then heroics (R)
      abilities.sort((a, b) => {
        if (a.trait && !b.trait) return -1
        if (!a.trait && b.trait) return 1
        
        const order = ['D', 'Q', 'W', 'E', 'R', 'R2']
        const aIndex = order.indexOf(a.hotkey || '')
        const bIndex = order.indexOf(b.hotkey || '')
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        
        return 0
      })
      
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
 * Note: heroespatchnotes/heroes-talents stores ability icons in images/talents/ (not images/abilities/)
 */
export function getAbilityIconUrl(iconFilename: string): string {
  if (!iconFilename) return ''
  const name = iconFilename.replace(/\.(png|jpg|jpeg)$/i, '')
  return `${JSDELIVR_BASE}/images/talents/${name}.png`
}

/**
 * Clear heroes cache (useful for pull-to-refresh)
 */
export function clearHeroesCache(): void {
  heroesCache = null
  cacheTimestamp = 0
}
