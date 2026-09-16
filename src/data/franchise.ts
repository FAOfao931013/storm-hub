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
 * Get role icon path (SVG for now, may need PNG for WeChat)
 */
export function getRoleIconPath(role: string): string {
  const roleMap: Record<string, string> = {
    'Tank': '/static/icons/roles/tank.svg',
    'Bruiser': '/static/icons/roles/bruiser.svg',
    'Melee Assassin': '/static/icons/roles/melee-assassin.svg',
    'Ranged Assassin': '/static/icons/roles/ranged-assassin.svg',
    'Healer': '/static/icons/roles/healer.svg',
    'Support': '/static/icons/roles/support.svg'
  }
  return roleMap[role] || ''
}

/**
 * Get franchise icon path (SVG for now, may need PNG for WeChat)
 */
export function getFranchiseIconPath(franchise: string): string {
  const franchiseMap: Record<string, string> = {
    'Warcraft': '/static/icons/franchises/warcraft.svg',
    'Starcraft': '/static/icons/franchises/starcraft.svg',
    'Diablo': '/static/icons/franchises/diablo.svg',
    'Overwatch': '/static/icons/franchises/overwatch.svg',
    'Nexus': '/static/icons/franchises/nexus.svg'
  }
  return franchiseMap[franchise] || ''
}
