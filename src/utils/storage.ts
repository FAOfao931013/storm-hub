import type { FavoritesData } from '@/types/hero'

const FAVORITES_KEY = 'storm_hub_favorites'

/**
 * Get favorites from local storage
 */
export function getFavorites(): string[] {
  try {
    const data = uni.getStorageSync(FAVORITES_KEY)
    if (data && Array.isArray(data.heroes)) {
      return data.heroes
    }
    return []
  } catch (error) {
    console.error('Failed to get favorites:', error)
    return []
  }
}

/**
 * Save favorites to local storage
 */
export function saveFavorites(heroes: string[]): void {
  try {
    const data: FavoritesData = { heroes }
    uni.setStorageSync(FAVORITES_KEY, data)
  } catch (error) {
    console.error('Failed to save favorites:', error)
  }
}

/**
 * Check if a hero is favorited
 */
export function isFavorite(heroShortName: string): boolean {
  const favorites = getFavorites()
  return favorites.includes(heroShortName)
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(heroShortName: string): boolean {
  const favorites = getFavorites()
  const index = favorites.indexOf(heroShortName)
  
  if (index >= 0) {
    // Remove from favorites
    favorites.splice(index, 1)
    saveFavorites(favorites)
    return false
  } else {
    // Add to favorites
    favorites.push(heroShortName)
    saveFavorites(favorites)
    return true
  }
}
