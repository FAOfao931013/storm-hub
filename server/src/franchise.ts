import { readFileSync } from 'node:fs'
import { FRANCHISE_PATH } from './config.ts'

type FranchiseMap = Record<string, string>

let cached: { map: FranchiseMap; lower: Map<string, string> } | null = null

function loadFranchiseMap() {
  if (cached) return cached

  const map = JSON.parse(readFileSync(FRANCHISE_PATH, 'utf8')) as FranchiseMap
  const lower = new Map<string, string>()
  for (const [key, value] of Object.entries(map)) {
    lower.set(key.toLowerCase(), value)
  }
  cached = { map, lower }
  return cached
}

export function getFranchise(shortName: string, attributeId?: string): string {
  const { map, lower } = loadFranchiseMap()

  if (shortName && map[shortName]) return map[shortName]
  if (attributeId && map[attributeId]) return map[attributeId]

  if (shortName) {
    const hit = lower.get(shortName.toLowerCase())
    if (hit) return hit
  }

  if (attributeId) {
    const hit = lower.get(attributeId.toLowerCase())
    if (hit) return hit
  }

  return 'Nexus'
}
