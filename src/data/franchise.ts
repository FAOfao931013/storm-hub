/**
 * Franchise mapping for heroes
 * Maps hero short_name to franchise (Warcraft, Starcraft, Diablo, Overwatch, Nexus)
 */

import franchiseData from './franchise.json'

export type FranchiseType = 'Warcraft' | 'Starcraft' | 'Diablo' | 'Overwatch' | 'Nexus'

const franchiseMap = franchiseData as Record<string, FranchiseType>

/**
 * Get franchise for a hero by short_name or attribute_id
 */
export function getFranchise(shortName: string): FranchiseType {
  return franchiseMap[shortName] || 'Nexus'
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
