import type { Ability, Talent, ZhcnHeroData } from './types.ts'

function normIcon(value: string | undefined): string {
  return (value || '').replace(/\.(png|jpg|jpeg)$/i, '').toLowerCase()
}

export function mergeZhcnAbilities(
  abilities: Ability[],
  zhcnData: ZhcnHeroData | null
): Ability[] {
  if (!zhcnData?.abilities?.length) return abilities

  return abilities.map((ability) => {
    const zhcnAbility = zhcnData.abilities.find(
      (z) =>
        z.icon === ability.icon ||
        normIcon(z.icon) === normIcon(ability.icon) ||
        (ability.name &&
          z.buttonId.toLowerCase().includes(ability.name.toLowerCase())) ||
        (ability.hotkey && z.abilityType === ability.hotkey)
    )

    if (zhcnAbility && (zhcnAbility.name || zhcnAbility.full)) {
      return {
        ...ability,
        title: zhcnAbility.name || ability.title,
        description:
          zhcnAbility.full || zhcnAbility.short || ability.description,
      }
    }

    return ability
  })
}

export function mergeZhcnTalents(
  talents: Talent[],
  zhcnData: ZhcnHeroData | null
): Talent[] {
  if (!zhcnData?.talents?.length) return talents

  return talents.map((talent) => {
    const zhcnTalent = zhcnData.talents.find(
      (z) =>
        z.icon === talent.icon ||
        normIcon(z.icon) === normIcon(talent.icon) ||
        (z.level === talent.level && z.sort === talent.sort)
    )

    if (zhcnTalent && (zhcnTalent.name || zhcnTalent.full)) {
      return {
        ...talent,
        title: zhcnTalent.name || talent.title,
        description: zhcnTalent.full || zhcnTalent.short || talent.description,
      }
    }

    return talent
  })
}
