/**
 * Franchise mapping for heroes
 * Maps hero short_name to franchise (Warcraft, Starcraft, Diablo, Overwatch, Nexus)
 */

import franchiseData from './franchise.json'

export type FranchiseType = 'Warcraft' | 'Starcraft' | 'Diablo' | 'Overwatch' | 'Nexus'

const franchiseMap = franchiseData as Record<string, FranchiseType>

// Build case-insensitive lookup map once
const lowerCaseMap = new Map<string, FranchiseType>()
Object.entries(franchiseMap).forEach(([key, value]) => {
  lowerCaseMap.set(key.toLowerCase(), value)
})

/**
 * Get franchise for a hero by short_name and/or attribute_id
 * Tries multiple lookup strategies with case-insensitive fallback
 */
export function getFranchise(shortName: string, attributeId?: string): FranchiseType {
  // Try exact match on short_name
  if (shortName && franchiseMap[shortName]) {
    return franchiseMap[shortName]
  }
  
  // Try exact match on attribute_id
  if (attributeId && franchiseMap[attributeId]) {
    return franchiseMap[attributeId]
  }
  
  // Try case-insensitive match on short_name
  if (shortName) {
    const lowerShort = shortName.toLowerCase()
    if (lowerCaseMap.has(lowerShort)) {
      return lowerCaseMap.get(lowerShort)!
    }
  }
  
  // Try case-insensitive match on attribute_id
  if (attributeId) {
    const lowerAttr = attributeId.toLowerCase()
    if (lowerCaseMap.has(lowerAttr)) {
      return lowerCaseMap.get(lowerAttr)!
    }
  }
  
  // Default fallback
  return 'Nexus'
}

/**
 * Get all available franchises
 */
export function getAllFranchises(): FranchiseType[] {
  return ['Warcraft', 'Starcraft', 'Diablo', 'Overwatch', 'Nexus']
}

/**
 * Get role icon path (PNG from HotS game assets)
 */
export function getRoleIconPath(role: string): string {
  const roleMap: Record<string, string> = {
    'Tank': '/static/icons/roles/tank.png',
    'Bruiser': '/static/icons/roles/bruiser.png',
    'Melee Assassin': '/static/icons/roles/melee-assassin.png',
    'Ranged Assassin': '/static/icons/roles/ranged-assassin.png',
    'Healer': '/static/icons/roles/healer.png',
    'Support': '/static/icons/roles/support.png'
  }
  return roleMap[role] || ''
}

/**
 * Get franchise icon path (PNG from HotS game assets)
 */
export function getFranchiseIconPath(franchise: string): string {
  const franchiseMap: Record<string, string> = {
    'Warcraft': '/static/icons/franchises/warcraft.png',
    'Starcraft': '/static/icons/franchises/starcraft.png',
    'Diablo': '/static/icons/franchises/diablo.png',
    'Overwatch': '/static/icons/franchises/overwatch.png',
    'Nexus': '/static/icons/franchises/nexus.png'
  }
  return franchiseMap[franchise] || ''
}
