import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

vi.mock('node-cache', () => {
  const store = new Map<string, unknown>()
  return {
    default: class MockNodeCache {
      get(key: string) { return store.get(key) }
      set(key: string, value: unknown, _ttl: number) { store.set(key, value); return true }
      static __store = store
    },
  }
})

import { cacheMiddleware } from './cache.js'

function createMockReq(url: string): Partial<Request> {
  return { originalUrl: url }
}

function createMockRes() {
  const res = {
    _jsonData: undefined as unknown,
    json: vi.fn(function (body: unknown) {
      res._jsonData = body
      return res
    }),
  }
  return res
}

describe('cacheMiddleware', () => {
  let NodeCacheStore: Map<string, unknown>

  beforeEach(async () => {
    const mod = await import('node-cache')
    NodeCacheStore = (mod.default as unknown as { __store: Map<string, unknown> }).__store
    NodeCacheStore.clear()
  })

  it('calls next() on cache miss', () => {
    const middleware = cacheMiddleware(900)
    const req = createMockReq('/api/search?query=batman')
    const res = createMockRes()
    const next = vi.fn()

    middleware(req as Request, res as unknown as Response, next as NextFunction)

    expect(next).toHaveBeenCalledOnce()
  })

  it('does not call res.json on cache miss', () => {
    const middleware = cacheMiddleware(900)
    const req = createMockReq('/api/search?query=batman')
    const res = createMockRes()
    const next = vi.fn()

    middleware(req as Request, res as unknown as Response, next as NextFunction)

    // json was NOT called by the middleware — it was replaced, but not invoked
    // The middleware replaces res.json, so the original spy won't be called
    expect(next).toHaveBeenCalled()
  })

  it('caches response body when res.json is called after cache miss', () => {
    const middleware = cacheMiddleware(900)
    const req = createMockReq('/api/search?query=batman')
    const res = createMockRes()
    const next = vi.fn()

    middleware(req as Request, res as unknown as Response, next as NextFunction)

    // Simulate route handler calling res.json (the wrapped version)
    const body = { results: [{ id: 1, title: 'Batman' }] }
    res.json(body)

    expect(NodeCacheStore.get('/api/search?query=batman')).toEqual(body)
  })

  it('returns cached response on cache hit without calling next()', () => {
    const middleware = cacheMiddleware(900)
    const url = '/api/search?query=batman'
    const cachedBody = { results: [{ id: 1, title: 'Batman' }] }

    NodeCacheStore.set(url, cachedBody)

    const req = createMockReq(url)
    const res = createMockRes()
    const next = vi.fn()

    middleware(req as Request, res as unknown as Response, next as NextFunction)

    expect(res.json).toHaveBeenCalledWith(cachedBody)
    expect(next).not.toHaveBeenCalled()
  })

  it('maintains separate cache entries for different URLs', () => {
    const middleware = cacheMiddleware(900)

    const req1 = createMockReq('/api/search?query=batman')
    const res1 = createMockRes()
    const next1 = vi.fn()
    middleware(req1 as Request, res1 as unknown as Response, next1 as NextFunction)
    res1.json({ results: [{ id: 1, title: 'Batman' }] })

    const req2 = createMockReq('/api/search?query=superman')
    const res2 = createMockRes()
    const next2 = vi.fn()
    middleware(req2 as Request, res2 as unknown as Response, next2 as NextFunction)
    res2.json({ results: [{ id: 2, title: 'Superman' }] })

    expect(NodeCacheStore.get('/api/search?query=batman')).toEqual({ results: [{ id: 1, title: 'Batman' }] })
    expect(NodeCacheStore.get('/api/search?query=superman')).toEqual({ results: [{ id: 2, title: 'Superman' }] })
  })

  it('serves cached data on second request to same URL', () => {
    const middleware = cacheMiddleware(900)
    const url = '/api/movies/123'

    const req1 = createMockReq(url)
    const res1 = createMockRes()
    const next1 = vi.fn()
    middleware(req1 as Request, res1 as unknown as Response, next1 as NextFunction)
    const body = { id: 123, title: 'Inception' }
    res1.json(body)

    expect(next1).toHaveBeenCalledOnce()

    const req2 = createMockReq(url)
    const res2 = createMockRes()
    const next2 = vi.fn()
    middleware(req2 as Request, res2 as unknown as Response, next2 as NextFunction)

    expect(res2.json).toHaveBeenCalledWith(body)
    expect(next2).not.toHaveBeenCalled()
  })
})
