import type { Talent } from '@/types/hero'

const TALENT_BUILDS_KEY = 'storm_hub_talent_builds'
const MAX_BUILDS_PER_HERO = 5

export interface TalentBuildSelection {
  [level: number]: string // level -> talent name
}

export interface TalentBuild {
  name: string
  selections: TalentBuildSelection
  updatedAt: number
}

export interface HeroBuildsData {
  [slotIndex: number]: TalentBuild // Fixed 5 slots (0-4)
}

export interface TalentBuildsData {
  [heroShortName: string]: HeroBuildsData
}

/**
 * Get all talent builds from local storage
 */
function getAllTalentBuilds(): TalentBuildsData {
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
 * Get talent builds for a specific hero (returns all 5 slots)
 */
export function getHeroTalentBuilds(heroShortName: string): HeroBuildsData {
  const allBuilds = getAllTalentBuilds()
  return allBuilds[heroShortName] || {}
}

/**
 * Get a specific slot build for a hero
 */
export function getSlotBuild(heroShortName: string, slotIndex: number): TalentBuild | null {
  const heroBuilds = getHeroTalentBuilds(heroShortName)
  return heroBuilds[slotIndex] || null
}

/**
 * Get default slot name
 */
export function getDefaultSlotName(slotIndex: number): string {
  return `方案 ${slotIndex + 1}`
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
 * Save talent build to a specific slot
 */
export function saveToSlot(
  heroShortName: string,
  slotIndex: number,
  buildName: string,
  selections: TalentBuildSelection
): void {
  if (slotIndex < 0 || slotIndex >= MAX_BUILDS_PER_HERO) {
    throw new Error('Invalid slot index')
  }

  const allBuilds = getAllTalentBuilds()
  const heroBuilds = allBuilds[heroShortName] || {}

  heroBuilds[slotIndex] = {
    name: buildName,
    selections,
    updatedAt: Date.now()
  }

  allBuilds[heroShortName] = heroBuilds
  saveTalentBuilds(allBuilds)
}

/**
 * Rename a slot
 */
export function renameSlot(
  heroShortName: string,
  slotIndex: number,
  newName: string
): void {
  if (slotIndex < 0 || slotIndex >= MAX_BUILDS_PER_HERO) {
    throw new Error('Invalid slot index')
  }

  const allBuilds = getAllTalentBuilds()
  const heroBuilds = allBuilds[heroShortName] || {}

  if (heroBuilds[slotIndex]) {
    heroBuilds[slotIndex].name = newName
    heroBuilds[slotIndex].updatedAt = Date.now()
    allBuilds[heroShortName] = heroBuilds
    saveTalentBuilds(allBuilds)
  }
}
