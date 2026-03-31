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
async function getRouteHandler(path: string): Promise<(req: any, res: any, next: any) => Promise<void>> {
  const mod = await import('./trending.routes.js')
  const router = mod.trendingRoutes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (router as any).stack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = layers.find((l: any) => l.route?.path === path && l.route?.methods?.get)
  if (!layer?.route) throw new Error(`GET ${path} route not found`)
  const handlers = layer.route.stack
  return handlers[handlers.length - 1].handle
}

describe('trending routes - GET /', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defaults to day time window', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [
          { id: 1, title: 'Movie', poster_path: '/m.jpg', backdrop_path: '/b.jpg', release_date: '2024-01-01', overview: 'Desc', vote_average: 7.5, genre_ids: [28], popularity: 100 },
        ],
      },
    })

    const handler = await getRouteHandler('/')
    const req = createMockReq({})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(mockGet).toHaveBeenCalledWith('/trending/movie/day')
    const body = res._body as { timeWindow: string }
    expect(body.timeWindow).toBe('day')
  })

  it('uses week when window=week', async () => {
    mockGet.mockResolvedValue({
      data: { results: [{ id: 1, title: 'Movie', poster_path: '/m.jpg', backdrop_path: '/b.jpg', release_date: '2024-01-01', overview: 'Desc', vote_average: 7.5, genre_ids: [28], popularity: 100 }] },
    })

    const handler = await getRouteHandler('/')
    const req = createMockReq({ window: 'week' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(mockGet).toHaveBeenCalledWith('/trending/movie/week')
    const body = res._body as { timeWindow: string }
    expect(body.timeWindow).toBe('week')
  })

  it('falls back to day for invalid window values', async () => {
    mockGet.mockResolvedValue({ data: { results: [] } })

    const handler = await getRouteHandler('/')
    const req = createMockReq({ window: 'month' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(mockGet).toHaveBeenCalledWith('/trending/movie/day')
  })

  it('maps response fields from snake_case to camelCase', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [{
          id: 42, title: 'Dune', poster_path: '/dune.jpg', backdrop_path: '/dune_bg.jpg',
          release_date: '2021-10-22', overview: 'Paul Atreides',
          vote_average: 8.0, genre_ids: [878, 12], popularity: 250.5,
        }],
      },
    })

    const handler = await getRouteHandler('/')
    const req = createMockReq({})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<Record<string, unknown>> }
    const movie = body.results[0]
    expect(movie.id).toBe(42)
    expect(movie.title).toBe('Dune')
    expect(movie.posterPath).toBe('/dune.jpg')
    expect(movie.backdropPath).toBe('/dune_bg.jpg')
    expect(movie.releaseDate).toBe('2021-10-22')
    expect(movie.voteAverage).toBe(8.0)
    expect(movie.genreIds).toEqual([878, 12])
  })

  it('calls next with error when tmdbClient.get rejects', async () => {
    const error = new Error('API failure')
    mockGet.mockRejectedValue(error)

    const handler = await getRouteHandler('/')
    const req = createMockReq({})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('trending routes - GET /people', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters out adult results from people endpoint', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [
          { id: 1, name: 'Actor A', profile_path: '/a.jpg', known_for_department: 'Acting', popularity: 100, adult: false },
          { id: 2, name: 'Actor B', profile_path: '/b.jpg', known_for_department: 'Acting', popularity: 80, adult: true },
          { id: 3, name: 'Actor C', profile_path: '/c.jpg', known_for_department: 'Directing', popularity: 60, adult: false },
        ],
      },
    })

    const handler = await getRouteHandler('/people')
    const req = createMockReq({})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<{ id: number; name: string }> }
    expect(body.results).toHaveLength(2)
    expect(body.results[0].name).toBe('Actor A')
    expect(body.results[1].name).toBe('Actor C')
  })

  it('maps people response correctly', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [{
          id: 10, name: 'Tom Hanks', profile_path: '/hanks.jpg',
          known_for_department: 'Acting', popularity: 150.3, adult: false,
        }],
      },
    })

    const handler = await getRouteHandler('/people')
    const req = createMockReq({})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<Record<string, unknown>>; timeWindow: string }
    const person = body.results[0]
    expect(person.id).toBe(10)
    expect(person.name).toBe('Tom Hanks')
    expect(person.profilePath).toBe('/hanks.jpg')
    expect(person.knownForDepartment).toBe('Acting')
    expect(person.popularity).toBe(150.3)
    expect(body.timeWindow).toBe('day')
  })

  it('uses week time window for people endpoint', async () => {
    mockGet.mockResolvedValue({ data: { results: [] } })

    const handler = await getRouteHandler('/people')
    const req = createMockReq({ window: 'week' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(mockGet).toHaveBeenCalledWith('/trending/person/week')
  })
})
