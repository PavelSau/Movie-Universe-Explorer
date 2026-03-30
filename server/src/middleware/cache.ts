import NodeCache from 'node-cache'
import type { Request, Response, NextFunction } from 'express'

const cache = new NodeCache()

export function cacheMiddleware(ttlSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl
    const cached = cache.get(key)

    if (cached) {
      res.json(cached)
      return
    }

    const originalJson = res.json.bind(res)
    res.json = (body: unknown) => {
      cache.set(key, body, ttlSeconds)
      return originalJson(body)
    }

    next()
  }
}
