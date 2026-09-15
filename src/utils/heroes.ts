/**
 * Heroes data utilities
 * Fetches and manages hero data from Heroes Profile API
 */

import franchiseMap from '../../data/zhcn/franchise.json';

export interface Hero {
  short_name: string;
  name: string;
  attribute_id: string;
  new_role?: string;
  role?: string;
  franchise?: string;
  icon?: string;
}

export type RoleType = 'Tank' | 'Bruiser' | 'Melee Assassin' | 'Ranged Assassin' | 'Healer' | 'Support';
export type FranchiseType = 'Warcraft' | 'Starcraft' | 'Diablo' | 'Overwatch' | 'Nexus';

const HEROES_API = 'https://www.heroesprofile.com/api/Heroes/';
const HEROES_IMAGES_BASE = 'https://raw.githubusercontent.com/HeroesToolChest/heroes-images/main/heroes';

// Cache for hero data
let heroesCache: Hero[] | null = null;

/**
 * Get hero icon URL
 */
export function getHeroIconUrl(shortName: string): string {
  return `${HEROES_IMAGES_BASE}/${shortName.toLowerCase()}.png`;
}

/**
 * Get Chinese hero name (from zhcn overlay if available)
 */
export function getChineseName(hero: Hero): string {
  // For now, return the English name
  // This can be extended to fetch from zhcn data
  return hero.name || hero.short_name;
}

/**
 * Get franchise for a hero
 */
export function getHeroFranchise(shortName: string): FranchiseType {
  const franchise = (franchiseMap as Record<string, string>)[shortName] || 
                   (franchiseMap as Record<string, string>)[shortName.toLowerCase()] ||
                   'Nexus';
  return franchise as FranchiseType;
}

/**
 * Fetch all heroes from Heroes Profile API
 */
export async function fetchHeroes(): Promise<Hero[]> {
  if (heroesCache) {
    return heroesCache;
  }

  try {
    const response = await fetch(HEROES_API);
    if (!response.ok) {
      throw new Error(`Failed to fetch heroes: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Enhance heroes with franchise data
    const heroes = (Array.isArray(data) ? data : []).map((hero: Hero) => ({
      ...hero,
      franchise: getHeroFranchise(hero.short_name || hero.attribute_id)
    }));
    
    heroesCache = heroes;
    return heroes;
  } catch (error) {
    console.error('Error fetching heroes:', error);
    return [];
  }
}

/**
 * Get all available roles
 */
export function getAllRoles(): RoleType[] {
  return ['Tank', 'Bruiser', 'Melee Assassin', 'Ranged Assassin', 'Healer', 'Support'];
}

/**
 * Get all available franchises
 */
export function getAllFranchises(): FranchiseType[] {
  return ['Warcraft', 'Starcraft', 'Diablo', 'Overwatch', 'Nexus'];
}

/**
 * Filter heroes by role, franchise, and search query
 */
export function filterHeroes(
  heroes: Hero[],
  selectedRole: RoleType | null,
  selectedFranchise: FranchiseType | null,
  searchQuery: string
): Hero[] {
  return heroes.filter(hero => {
    // Role filter
    if (selectedRole && hero.new_role !== selectedRole) {
      return false;
    }
    
    // Franchise filter
    if (selectedFranchise && hero.franchise !== selectedFranchise) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = (hero.name || '').toLowerCase();
      const shortName = (hero.short_name || '').toLowerCase();
      if (!name.includes(query) && !shortName.includes(query)) {
        return false;
      }
    }
    
    return true;
  });
}
