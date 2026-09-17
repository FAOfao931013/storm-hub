import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const SERVER_ROOT = resolve(__dirname, '..')
export const REPO_ROOT = resolve(SERVER_ROOT, '..')

config({ path: resolve(SERVER_ROOT, '.env') })

export const PORT = Number(process.env.PORT || 3000)
export const HOST = process.env.HOST || '127.0.0.1'
export const ADMIN_KEY = process.env.ADMIN_KEY || ''

export const HEROES_PROFILE_BASE = (
  process.env.HEROES_PROFILE_BASE || 'https://api.heroesprofile.com/openApi'
).replace(/\/$/, '')

export const JSDELIVR_HERO_BASE = (
  process.env.JSDELIVR_HERO_BASE ||
  'https://cdn.jsdelivr.net/gh/heroespatchnotes/heroes-talents@master/hero'
).replace(/\/$/, '')

export const DB_PATH = process.env.DB_PATH || resolve(SERVER_ROOT, 'data/stormhub.db')
export const ZHCN_DIR = resolve(REPO_ROOT, 'data/zhcn/heroes')
export const FRANCHISE_PATH = resolve(REPO_ROOT, 'src/data/franchise.json')

export const USER_AGENT = 'storm-hub-api/1.0 (+https://github.com/FAOfao931013/storm-hub)'
