import type { Talent } from '@/types/hero'

const TALENT_BUILDS_KEY = 'storm_hub_talent_builds'
const MAX_BUILDS_PER_HERO = 5

export interface TalentBuildSelection {
  [level: number]: string // level -> talent name
}

export interface TalentBuild {
  id: string
  name: string
  selections: TalentBuildSelection
  createdAt: number
  updatedAt: number
}

export interface TalentBuildsData {
  [heroShortName: string]: TalentBuild[]
}

/**
 * Generate a unique ID for a build
 */
function generateBuildId(): string {
  return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get all talent builds from local storage
 */
export function getAllTalentBuilds(): TalentBuildsData {
  try {
    const data = uni.getStorageSync(TALENT_BUILDS_KEY)
    if (data && typeof data === 'object') {
      return data
    }
    return {}
  } catch (error) {
    console.error('Failed to get talent builds:', error)
    return {}
  }
}

/**
 * Get talent builds for a specific hero
 */
export function getHeroTalentBuilds(heroShortName: string): TalentBuild[] {
  const allBuilds = getAllTalentBuilds()
  return allBuilds[heroShortName] || []
}

/**
 * Save all talent builds to local storage
 */
function saveTalentBuilds(data: TalentBuildsData): void {
  try {
    uni.setStorageSync(TALENT_BUILDS_KEY, data)
  } catch (error) {
    console.error('Failed to save talent builds:', error)
    throw error
  }
}

/**
 * Convert selected talents to build selection format
 */
export function convertSelectedTalentsToBuildSelection(
  selectedTalents: Record<number, Talent>
): TalentBuildSelection {
  const selection: TalentBuildSelection = {}
  for (const level in selectedTalents) {
    selection[Number(level)] = selectedTalents[level].name
  }
  return selection
}

/**
 * Save a new talent build (or update existing if id matches)
 */
export function saveTalentBuild(
  heroShortName: string,
  buildName: string,
  selections: TalentBuildSelection,
  buildId?: string
): { success: boolean; build?: TalentBuild; error?: string } {
  const allBuilds = getAllTalentBuilds()
  const heroBuilds = allBuilds[heroShortName] || []

  const now = Date.now()

  if (buildId) {
    // Update existing build
    const existingIndex = heroBuilds.findIndex(b => b.id === buildId)
    if (existingIndex >= 0) {
      heroBuilds[existingIndex] = {
        ...heroBuilds[existingIndex],
        name: buildName,
        selections,
        updatedAt: now
      }
      allBuilds[heroShortName] = heroBuilds
      saveTalentBuilds(allBuilds)
      return { success: true, build: heroBuilds[existingIndex] }
    }
  }

  // Create new build
  if (heroBuilds.length >= MAX_BUILDS_PER_HERO) {
    return {
      success: false,
      error: `每个英雄最多保存 ${MAX_BUILDS_PER_HERO} 套方案`
    }
  }

  const newBuild: TalentBuild = {
    id: generateBuildId(),
    name: buildName,
    selections,
    createdAt: now,
    updatedAt: now
  }

  heroBuilds.push(newBuild)
  allBuilds[heroShortName] = heroBuilds
  saveTalentBuilds(allBuilds)

  return { success: true, build: newBuild }
}

/**
 * Delete a talent build
 */
export function deleteTalentBuild(
  heroShortName: string,
  buildId: string
): boolean {
  const allBuilds = getAllTalentBuilds()
  const heroBuilds = allBuilds[heroShortName] || []

  const filteredBuilds = heroBuilds.filter(b => b.id !== buildId)
  
  if (filteredBuilds.length === heroBuilds.length) {
    return false // Build not found
  }

  allBuilds[heroShortName] = filteredBuilds
  saveTalentBuilds(allBuilds)
  return true
}

/**
 * Rename a talent build
 */
export function renameTalentBuild(
  heroShortName: string,
  buildId: string,
  newName: string
): boolean {
  const allBuilds = getAllTalentBuilds()
  const heroBuilds = allBuilds[heroShortName] || []

  const build = heroBuilds.find(b => b.id === buildId)
  if (!build) {
    return false
  }

  build.name = newName
  build.updatedAt = Date.now()
  
  allBuilds[heroShortName] = heroBuilds
  saveTalentBuilds(allBuilds)
  return true
}

/**
 * Get default build name based on existing builds count
 */
export function getDefaultBuildName(heroShortName: string): string {
  const heroBuilds = getHeroTalentBuilds(heroShortName)
  const count = heroBuilds.length + 1
  return `方案 ${count}`
}
