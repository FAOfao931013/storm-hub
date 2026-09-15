import type { Ability, Talent } from '@/types/hero'

const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/gh/FAOfao931013/storm-hub@cursor/storm-hub-mvp-fb56'
const BUILD_ID = '2.55.11.94387'

interface ZhcnAbility {
  nameId: string
  buttonId: string
  name?: string
  short?: string
  full?: string
  icon: string
}

interface ZhcnTalent {
  nameId: string
  buttonId: string
  name?: string
  short?: string
  full?: string
  icon: string
  level: number
  sort: number
}

interface ZhcnHeroData {
  shortName: string
  heroName: string
  build: string
  abilities: ZhcnAbility[]
  talents: ZhcnTalent[]
}

// In-memory cache for Chinese hero data
const zhcnCache = new Map<string, ZhcnHeroData | null>()

/**
 * Fetch Chinese localization data for a hero
 * URL includes build ID for cache busting
 */
export async function fetchZhcnHeroData(shortName: string): Promise<ZhcnHeroData | null> {
  // Check cache
  if (zhcnCache.has(shortName)) {
    return zhcnCache.get(shortName) || null
  }
  
  try {
    const url = `${JSDELIVR_BASE}/data/zhcn/heroes/${shortName}.json?build=${BUILD_ID}`
    
    const response = await uni.request({
      url,
      method: 'GET',
      timeout: 8000
    })
    
    if (response.statusCode === 200 && response.data) {
      const data = response.data as ZhcnHeroData
      zhcnCache.set(shortName, data)
      return data
    }
    
    // 404 or other error - cache null to avoid retry
    zhcnCache.set(shortName, null)
    return null
  } catch (error: any) {
    console.warn(`Failed to fetch zhcn data for ${shortName}:`, error)
    // Cache null on error
    zhcnCache.set(shortName, null)
    return null
  }
}

/**
 * Merge Chinese text into abilities
 * Matches by nameId first, then icon, then abilityType/hotkey
 */
export function mergeZhcnAbilities(abilities: Ability[], zhcnData: ZhcnHeroData | null): Ability[] {
  if (!zhcnData || !zhcnData.abilities) return abilities
  
  return abilities.map(ability => {
    // Try to match by nameId (from heroes-talents JSON if available)
    // Otherwise match by icon filename
    const zhcnAbility = zhcnData.abilities.find(z => 
      z.icon === ability.icon ||
      z.buttonId.toLowerCase().includes(ability.name.toLowerCase()) ||
      (ability.hotkey && z.abilityType === ability.hotkey)
    )
    
    if (zhcnAbility && (zhcnAbility.name || zhcnAbility.full)) {
      return {
        ...ability,
        title: zhcnAbility.name || ability.title,
        description: zhcnAbility.full || zhcnAbility.short || ability.description
      }
    }
    
    return ability
  })
}

/**
 * Merge Chinese text into talents
 * Matches by icon filename primarily
 */
export function mergeZhcnTalents(talents: Talent[], zhcnData: ZhcnHeroData | null): Talent[] {
  if (!zhcnData || !zhcnData.talents) return talents
  
  return talents.map(talent => {
    // Match by icon (most reliable) or nameId
    const zhcnTalent = zhcnData.talents.find(z =>
      z.icon === talent.icon ||
      (z.level === talent.level && z.sort === talent.sort)
    )
    
    if (zhcnTalent && (zhcnTalent.name || zhcnTalent.full)) {
      return {
        ...talent,
        title: zhcnTalent.name || talent.title,
        description: zhcnTalent.full || zhcnTalent.short || talent.description
      }
    }
    
    return talent
  })
}

/**
 * Role name Chinese localization
 */
export const ROLE_CN_MAP: Record<string, string> = {
  'Tank': '坦克',
  'Bruiser': '战士',
  'Healer': '治疗',
  'Support': '辅助',
  'Melee Assassin': '近战刺杀',
  'Ranged Assassin': '远程刺杀',
  'Assassin': '刺杀',
  'Specialist': '专家',
  'Warrior': '战士'
}

/**
 * Type name Chinese localization
 */
export const TYPE_CN_MAP: Record<string, string> = {
  'Melee': '近战',
  'Ranged': '远程'
}

/**
 * Get Chinese role name
 */
export function getRoleCN(role: string): string {
  return ROLE_CN_MAP[role] || role
}

/**
 * Get Chinese type name
 */
export function getTypeCN(type: string): string {
  return TYPE_CN_MAP[type] || type
}
