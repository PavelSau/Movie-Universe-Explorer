import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

const mockGet = vi.fn()

vi.mock('../services/tmdb.js', () => ({
  tmdbClient: { get: mockGet },
}))

vi.mock('../middleware/cache.js', () => ({
  cacheMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}))

function createMockReq(
  query: Record<string, string | undefined> = {},
): Partial<Request> {
  return { query }
}

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
  const mod = await import('./discover.routes.js')
  const router = mod.discoverRoutes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (router as any).stack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = layers.find((l: any) => l.route?.path === '/' && l.route?.methods?.get)
  if (!layer?.route) throw new Error('GET / route not found')
  const handlers = layer.route.stack
  return handlers[handlers.length - 1].handle
}

describe('discover routes - GET /', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('maps response fields from snake_case to camelCase', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [
          { id: 550, title: 'Fight Club', poster_path: '/fc.jpg', release_date: '1999-10-15', vote_average: 8.4, genre_ids: [18, 53], popularity: 60 },
        ],
        total_pages: 5,
        total_results: 100,
      },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<Record<string, unknown>>; totalPages: number; totalResults: number }
    expect(body.totalPages).toBe(5)
    expect(body.totalResults).toBe(100)
    const movie = body.results[0]
    expect(movie.id).toBe(550)
    expect(movie.title).toBe('Fight Club')
    expect(movie.posterPath).toBe('/fc.jpg')
    expect(movie.releaseDate).toBe('1999-10-15')
    expect(movie.voteAverage).toBe(8.4)
    expect(movie.genreIds).toEqual([18, 53])
    expect(movie.popularity).toBe(60)
  })

  it('passes default sort_by and vote_count params to TMDb', async () => {
    mockGet.mockResolvedValue({
      data: { results: [], total_pages: 0, total_results: 0 },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(mockGet).toHaveBeenCalledWith('/discover/movie', {
      params: expect.objectContaining({
        sort_by: 'vote_average.desc',
        page: 1,
        'vote_count.gte': 50,
      }),
    })
  })

  it('passes genre filter to TMDb when with_genres is provided', async () => {
    mockGet.mockResolvedValue({
      data: { results: [], total_pages: 0, total_results: 0 },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({ with_genres: '28,18' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(mockGet).toHaveBeenCalledWith('/discover/movie', {
      params: expect.objectContaining({
        with_genres: '28,18',
      }),
    })
  })

  it('passes date range filters when provided', async () => {
    mockGet.mockResolvedValue({
      data: { results: [], total_pages: 0, total_results: 0 },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({
      'primary_release_date.gte': '2020-01-01',
      'primary_release_date.lte': '2020-12-31',
    })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(mockGet).toHaveBeenCalledWith('/discover/movie', {
      params: expect.objectContaining({
        'primary_release_date.gte': '2020-01-01',
        'primary_release_date.lte': '2020-12-31',
      }),
    })
  })

  it('uses custom sort_by and page when provided', async () => {
    mockGet.mockResolvedValue({
      data: { results: [], total_pages: 0, total_results: 0 },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({ sort_by: 'popularity.desc', page: '3' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(mockGet).toHaveBeenCalledWith('/discover/movie', {
      params: expect.objectContaining({
        sort_by: 'popularity.desc',
        page: 3,
      }),
    })
  })

  it('calls next with error when tmdbClient.get rejects', async () => {
    const error = new Error('TMDb error')
    mockGet.mockRejectedValue(error)

    const handler = await getRouteHandler()
    const req = createMockReq({})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
