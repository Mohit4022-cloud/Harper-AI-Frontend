import jwt from 'jsonwebtoken'
import { User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  organizationId: string
}

export function generateTokens(user: User) {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })

  return { token, refreshToken }
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function verifyRefreshToken(refreshToken: string): JWTPayload | null {
  try {
    return jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}