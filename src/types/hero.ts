// Heroes Profile API response types

export interface HeroTranslations {
  chinese_cn?: string;
  chinese_tw?: string;
  english?: string;
  [key: string]: string | undefined;
}

export interface Hero {
  name: string;
  short_name: string;
  attribute_id: string;
  role: string;
  new_role: string;
  type: string;
  translations: HeroTranslations;
  icon?: string;
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
