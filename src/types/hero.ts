// Heroes Profile API response types

// API returns translations as a string array containing multilingual aliases
// Typically includes: [en_lowercase, variants, russian, korean, chinese_simplified, chinese_traditional]
export type HeroTranslations = string[];

export interface Hero {
  id: number;
  name: string;
  short_name: string;
  attribute_id: string;
  role: string;
  new_role: string;
  type: string;
  release_date?: string;
  translations: HeroTranslations;
  icon?: string;
  /** Filled by storm-hub API after sync */
  franchise?: string;
  name_cn?: string;
}

export interface HeroDetailResponse {
  hero: Hero;
  abilities: Ability[];
  talents: Talent[];
  synced_at: string | null;
}

export interface Talent {
  name: string;
  title: string;
  description: string;
  icon: string;
  icon_url?: Record<string, string>;
  level: number;
  sort: number;
}

export interface Ability {
  owner: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  hotkey?: string;
  cooldown?: number;
  mana_cost?: number;
  trait?: boolean;
}

export interface HeroDetail extends Hero {
  abilities?: Ability[];
  talents?: Talent[];
}

// Filter options
export type RoleType = 'Tank' | 'Bruiser' | 'Healer' | 'Support' | 'Melee Assassin' | 'Ranged Assassin' | string;

// Local favorites storage
export interface FavoritesData {
  heroes: string[]; // Array of hero short_names
}
