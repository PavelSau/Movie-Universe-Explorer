import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export interface AuthRequest extends Request {
  userId?: number
  username?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required', code: 401 })
    return
  }

  try {
    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number; username: string }
    req.userId = decoded.userId
    req.username = decoded.username
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 401 })
  }
}
