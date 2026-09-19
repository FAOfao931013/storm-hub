import jwt from 'jsonwebtoken'
import { JWT_SECRET } from './config.ts'

export interface TokenPayload {
  openid: string
  iat?: number
  exp?: number
}

export function generateToken(openid: string): string {
  if (!JWT_SECRET || JWT_SECRET === 'change-me-to-a-long-random-string') {
    throw new Error('JWT_SECRET is not properly configured')
  }
  return jwt.sign({ openid }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): TokenPayload | null {
  if (!JWT_SECRET || JWT_SECRET === 'change-me-to-a-long-random-string') {
    return null
  }
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}
