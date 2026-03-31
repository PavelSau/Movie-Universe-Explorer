import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

const mockGet = vi.fn()

vi.mock('../services/tmdb.js', () => ({
  tmdbClient: { get: mockGet },
}))

vi.mock('../middleware/cache.js', () => ({
  cacheMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}))

function createMockRes() {
  const res = {
    _body: undefined as unknown,
    status: vi.fn().mockImplementation(() => res),
    json: vi.fn().mockImplementation((body: unknown) => { res._body = body; return res }),
  }
  return res
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRouteHandler(): Promise<(req: any, res: any, next: any) => Promise<void>> {
  const mod = await import('./genres.routes.js')
  const router = mod.genresRoutes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (router as any).stack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = layers.find((l: any) => l.route?.path === '/' && l.route?.methods?.get)
  if (!layer?.route) throw new Error('GET / route not found')
  const handlers = layer.route.stack
  return handlers[handlers.length - 1].handle
}

describe('genres routes - GET /', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns genres with correct shape', async () => {
    mockGet.mockResolvedValue({
      data: {
        genres: [
          { id: 28, name: 'Action' },
          { id: 18, name: 'Drama' },
          { id: 53, name: 'Thriller' },
        ],
      },
    })

    const handler = await getRouteHandler()
    const req = { query: {} }
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { genres: Array<{ id: number; name: string }> }
    expect(body.genres).toHaveLength(3)
    expect(body.genres[0]).toEqual({ id: 28, name: 'Action' })
    expect(body.genres[1]).toEqual({ id: 18, name: 'Drama' })
    expect(body.genres[2]).toEqual({ id: 53, name: 'Thriller' })
  })

  it('calls the correct TMDb endpoint', async () => {
    mockGet.mockResolvedValue({ data: { genres: [] } })

    const handler = await getRouteHandler()
    const req = { query: {} }
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(mockGet).toHaveBeenCalledWith('/genre/movie/list')
  })

  it('returns empty genres array when TMDb returns no genres', async () => {
    mockGet.mockResolvedValue({ data: { genres: [] } })

    const handler = await getRouteHandler()
    const req = { query: {} }
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { genres: Array<{ id: number; name: string }> }
    expect(body.genres).toEqual([])
  })

  it('calls next with error when tmdbClient.get rejects', async () => {
    const error = new Error('TMDb down')
    mockGet.mockRejectedValue(error)

    const handler = await getRouteHandler()
    const req = { query: {} }
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
