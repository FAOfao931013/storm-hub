/**
 * Hero display-name overrides applied at sync and when serving the API.
 * Default: first translations entry that contains CJK characters.
 */

const NAME_CN_USE_LAST_TRANSLATION = new Set<number>([
  2,  // Alarak: 亞拉瑞克 -> 阿拉纳克
  4,  // Artanis: 亞坦尼斯 -> 阿塔尼斯
  10, // Chen: 老陳 -> 陈
  11, // Cho: 丘 -> 古
  18, // Gall: 加利 -> 加尔
  29, // Kharazim: 克拉辛 -> 卡拉辛姆
  37, // Malthael: 瑪瑟爾 -> 马萨伊尔
  38, // Medivh: 麥迪文 -> 麦迪文
  41, // Nazeebo: 納奇班 -> 纳兹波
  42, // Nova: 諾娃 -> 诺娃
  45, // Raynor: 雷諾 -> 雷诺
  46, // Rehgar: 雷加 -> 雷加尔
  49, // Sgt. Hammer: 榔頭中士 -> 重锤军士
  57, // Thrall: 索爾 -> 萨尔
  64, // Valla: 狩魔獵人 -> 维拉
  73, // Junkrat: 炸彈鼠 -> 狂鼠
])

export function getChineseName(translations: string[], heroId?: number): string {
  if (!Array.isArray(translations) || translations.length === 0) return ''

  if (heroId != null && NAME_CN_USE_LAST_TRANSLATION.has(heroId)) {
    return translations[translations.length - 1] || ''
  }

  const chineseEntry = translations.find((t) => t && /[\u4e00-\u9fff]/.test(t))
  return chineseEntry || ''
}
