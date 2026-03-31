import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Response, NextFunction } from 'express'

const mockQuery = vi.fn()

vi.mock('../services/db.js', () => ({
  pool: { query: (...args: unknown[]) => mockQuery(...args) },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}))

vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test-secret',
  },
}))

import jwt from 'jsonwebtoken'

/** Create a mock request that will pass requireAuth middleware */
function createAuthenticatedReq(
  overrides: {
    body?: Record<string, unknown>
    query?: Record<string, string | undefined>
  } = {},
) {
  // requireAuth reads from headers.authorization, then sets userId/username
  vi.mocked(jwt.verify).mockReturnValueOnce({ userId: 1, username: 'testuser' } as never)
  return {
    headers: { authorization: 'Bearer valid-token' },
    body: overrides.body || {},
    query: overrides.query || {},
    userId: undefined as number | undefined,
    username: undefined as string | undefined,
  }
}

function createMockRes() {
  const res = {
    _statusCode: 200,
    _body: undefined as unknown,
    status: vi.fn().mockImplementation((code: number) => { res._statusCode = code; return res }),
    json: vi.fn().mockImplementation((body: unknown) => { res._body = body; return res }),
  }
  return res
}

/**
 * The wishlist router uses `router.use(requireAuth)` as middleware on all routes.
 * We need to run the middleware chain (requireAuth + route handler) together.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRouteHandlerChain(path: string, method: string): Promise<Array<(req: any, res: any, next: any) => void>> {
  const mod = await import('./wishlist.routes.js')
  const router = mod.wishlistRoutes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (router as any).stack

  // Collect the router-level middleware (requireAuth)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const middlewareLayers = layers.filter((l: any) => !l.route)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLayer = layers.find((l: any) => l.route?.path === path && l.route?.methods?.[method])
  if (!routeLayer?.route) throw new Error(`${method.toUpperCase()} ${path} route not found`)

  const routeHandlers = routeLayer.route.stack.map((s: { handle: Function }) => s.handle)
  const middlewareHandlers = middlewareLayers.map((l: { handle: Function }) => l.handle)

  return [...middlewareHandlers, ...routeHandlers]
}

/** Execute a handler chain (middleware + route handler) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeChain(chain: Array<(req: any, res: any, next: any) => void>, req: any, res: any) {
  let idx = 0
  const next: NextFunction = (async (err?: unknown) => {
    if (err) return // error stops the chain
    idx++
    if (idx < chain.length) {
      await chain[idx](req, res as unknown as Response, next)
    }
  }) as NextFunction
  await chain[0](req, res as unknown as Response, next)
}

describe('wishlist routes - GET /', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns wishlist items with mapped fields', async () => {
    const chain = await getRouteHandlerChain('/', 'get')
    const req = createAuthenticatedReq()
    const res = createMockRes()

    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, entity_type: 'movie', entity_id: 550, title: 'Fight Club', poster_path: '/fc.jpg', created_at: '2026-01-01T00:00:00Z' },
        { id: 2, entity_type: 'person', entity_id: 287, title: 'Brad Pitt', poster_path: '/pitt.jpg', created_at: '2026-01-02T00:00:00Z' },
      ],
    })

    await executeChain(chain, req, res)

    const body = res._body as { items: Array<Record<string, unknown>> }
    expect(body.items).toHaveLength(2)
    expect(body.items[0]).toEqual({
      id: 1,
      entityType: 'movie',
      entityId: 550,
      title: 'Fight Club',
      posterPath: '/fc.jpg',
      createdAt: '2026-01-01T00:00:00Z',
    })
    expect(body.items[1].entityType).toBe('person')
  })

  it('returns empty items array when wishlist is empty', async () => {
    const chain = await getRouteHandlerChain('/', 'get')
    const req = createAuthenticatedReq()
    const res = createMockRes()

    mockQuery.mockResolvedValueOnce({ rows: [] })

    await executeChain(chain, req, res)

    const body = res._body as { items: Array<unknown> }
    expect(body.items).toEqual([])
  })
})

describe('wishlist routes - GET /check', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns inWishlist true when item exists', async () => {
    const chain = await getRouteHandlerChain('/check', 'get')
    const req = createAuthenticatedReq({ query: { entityType: 'movie', entityId: '550' } })
    const res = createMockRes()

    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] })

    await executeChain(chain, req, res)

    expect(res._body).toEqual({ inWishlist: true })
  })

  it('returns inWishlist false when item does not exist', async () => {
    const chain = await getRouteHandlerChain('/check', 'get')
    const req = createAuthenticatedReq({ query: { entityType: 'movie', entityId: '999' } })
    const res = createMockRes()

    mockQuery.mockResolvedValueOnce({ rows: [] })

    await executeChain(chain, req, res)

    expect(res._body).toEqual({ inWishlist: false })
  })

  it('returns 400 when entityType is missing', async () => {
    const chain = await getRouteHandlerChain('/check', 'get')
    const req = createAuthenticatedReq({ query: { entityId: '550' } })
    const res = createMockRes()

    await executeChain(chain, req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res._body).toEqual({ error: 'entityType and entityId are required', code: 400 })
  })

  it('returns 400 when entityId is missing', async () => {
    const chain = await getRouteHandlerChain('/check', 'get')
    const req = createAuthenticatedReq({ query: { entityType: 'movie' } })
    const res = createMockRes()

    await executeChain(chain, req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('wishlist routes - POST /', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when required fields are missing', async () => {
    const chain = await getRouteHandlerChain('/', 'post')
    const req = createAuthenticatedReq({ body: { entityType: 'movie' } })
    const res = createMockRes()

    await executeChain(chain, req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res._body).toEqual({ error: 'entityType, entityId, and title are required', code: 400 })
  })

  it('returns 400 when entityType is invalid', async () => {
    const chain = await getRouteHandlerChain('/', 'post')
    const req = createAuthenticatedReq({ body: { entityType: 'tv', entityId: 1, title: 'Show' } })
    const res = createMockRes()

    await executeChain(chain, req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res._body).toEqual({ error: 'entityType must be movie or person', code: 400 })
  })

  it('returns 201 with item data on successful add', async () => {
    const chain = await getRouteHandlerChain('/', 'post')
    const req = createAuthenticatedReq({
      body: { entityType: 'movie', entityId: 550, title: 'Fight Club', posterPath: '/fc.jpg' },
    })
    const res = createMockRes()

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 1,
        entity_type: 'movie',
        entity_id: 550,
        title: 'Fight Club',
        poster_path: '/fc.jpg',
        created_at: '2026-01-01T00:00:00Z',
      }],
    })

    await executeChain(chain, req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res._body).toEqual({
      id: 1,
      entityType: 'movie',
      entityId: 550,
      title: 'Fight Club',
      posterPath: '/fc.jpg',
      createdAt: '2026-01-01T00:00:00Z',
    })
  })

  it('returns "Already in wishlist" message on duplicate', async () => {
    const chain = await getRouteHandlerChain('/', 'post')
    const req = createAuthenticatedReq({
      body: { entityType: 'movie', entityId: 550, title: 'Fight Club' },
    })
    const res = createMockRes()

    mockQuery.mockResolvedValueOnce({ rows: [] }) // ON CONFLICT DO NOTHING returns empty

    await executeChain(chain, req, res)

    expect(res._body).toEqual({ message: 'Already in wishlist' })
  })
})

describe('wishlist routes - DELETE /', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when required fields are missing', async () => {
    const chain = await getRouteHandlerChain('/', 'delete')
    const req = createAuthenticatedReq({ body: { entityType: 'movie' } })
    const res = createMockRes()

    await executeChain(chain, req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res._body).toEqual({ error: 'entityType and entityId are required', code: 400 })
  })

  it('returns success message on delete', async () => {
    const chain = await getRouteHandlerChain('/', 'delete')
    const req = createAuthenticatedReq({
      body: { entityType: 'movie', entityId: 550 },
    })
    const res = createMockRes()

    mockQuery.mockResolvedValueOnce({ rows: [] })

    await executeChain(chain, req, res)

    expect(res._body).toEqual({ message: 'Removed from wishlist' })
  })
})
