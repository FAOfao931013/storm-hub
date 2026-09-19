import type { Context, Next } from 'hono'
import { extractToken, verifyToken } from './auth.ts'

export interface AuthContext {
  openid: string
}

export async function requireAuth(c: Context, next: Next) {
  const token = extractToken(c.req.header('Authorization'))
  
  if (!token) {
    return c.json({ error: '未登录' }, 401)
  }

  const payload = verifyToken(token)
  
  if (!payload) {
    return c.json({ error: '登录已过期' }, 401)
  }

  c.set('auth', { openid: payload.openid } as AuthContext)
  await next()
}
