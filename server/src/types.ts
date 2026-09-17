export interface Hero {
  id: number
  name: string
  short_name: string
  attribute_id: string
  role: string
  new_role: string
  type: string
  release_date?: string
  translations: string[]
  icon?: string
  franchise?: string
  name_cn?: string
}

export interface Talent {
  name: string
  title: string
  description: string
  icon: string
  icon_url?: Record<string, string>
  level: number
  sort: number
}

export interface Ability {
  owner: string
  name: string
  title: string
  description: string
  icon: string
  hotkey?: string
  cooldown?: number
  mana_cost?: number
  trait?: boolean
}

export interface HeroDetailResponse {
  hero: Hero
  abilities: Ability[]
  talents: Talent[]
  synced_at: string | null
}

export interface ZhcnAbility {
  nameId: string
  buttonId: string
  abilityType?: string
  name?: string
  short?: string
  full?: string
  icon: string
}

export interface ZhcnTalent {
  nameId: string
  buttonId: string
  name?: string
  short?: string
  full?: string
  icon: string
  level: number
  sort: number
}

export interface ZhcnHeroData {
  shortName: string
  heroName: string
  build: string
  abilities: ZhcnAbility[]
  talents: ZhcnTalent[]
}

export interface SyncResult {
  ok: boolean
  heroes: number
  details: number
  failed: string[]
  error?: string
  synced_at: string
}
