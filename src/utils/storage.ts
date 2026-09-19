import type { FavoritesData } from '@/types/hero'

const FAVORITES_KEY = 'storm_hub_favorites'
const AUTH_TOKEN_KEY = 'storm_hub_auth_token'
const USER_INFO_KEY = 'storm_hub_user_info'

export interface StoredUserInfo {
  openid: string
  nickname: string | null
}

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

/**
 * Get auth token from local storage
 */
export function getAuthToken(): string | null {
  try {
    return uni.getStorageSync(AUTH_TOKEN_KEY) || null
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return null
  }
}

/**
 * Save auth token to local storage
 */
export function saveAuthToken(token: string): void {
  try {
    uni.setStorageSync(AUTH_TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to save auth token:', error)
  }
}

/**
 * Remove auth token from local storage
 */
export function removeAuthToken(): void {
  try {
    uni.removeStorageSync(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to remove auth token:', error)
  }
}

/**
 * Get user info from local storage
 */
export function getUserInfo(): StoredUserInfo | null {
  try {
    const data = uni.getStorageSync(USER_INFO_KEY)
    return data || null
  } catch (error) {
    console.error('Failed to get user info:', error)
    return null
  }
}

/**
 * Save user info to local storage
 */
export function saveUserInfo(userInfo: StoredUserInfo): void {
  try {
    uni.setStorageSync(USER_INFO_KEY, userInfo)
  } catch (error) {
    console.error('Failed to save user info:', error)
  }
}

/**
 * Remove user info from local storage
 */
export function removeUserInfo(): void {
  try {
    uni.removeStorageSync(USER_INFO_KEY)
  } catch (error) {
    console.error('Failed to remove user info:', error)
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return !!getAuthToken()
}
