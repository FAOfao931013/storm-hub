import { config } from 'dotenv'
import { setDefaultResultOrder } from 'node:dns'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

setDefaultResultOrder('ipv4first')

const __dirname = dirname(fileURLToPath(import.meta.url))

export const SERVER_ROOT = resolve(__dirname, '..')
export const REPO_ROOT = resolve(SERVER_ROOT, '..')

config({ path: resolve(SERVER_ROOT, '.env') })

export const PORT = Number(process.env.PORT || 3000)
export const HOST = process.env.HOST || '127.0.0.1'
export const ADMIN_KEY = process.env.ADMIN_KEY || ''

export const WECHAT_APPID = process.env.WECHAT_APPID || ''
export const WECHAT_SECRET = process.env.WECHAT_SECRET || ''
export const JWT_SECRET = process.env.JWT_SECRET || ''

export const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true'
export const SMTP_USER = process.env.SMTP_USER || ''
export const SMTP_PASS = process.env.SMTP_PASS || ''

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
