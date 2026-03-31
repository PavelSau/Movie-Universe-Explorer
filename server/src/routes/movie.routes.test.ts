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
  params: Record<string, string> = {},
): Partial<Request> {
  return { params, query: {} }
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
  const mod = await import('./movie.routes.js')
  const router = mod.movieRoutes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (router as any).stack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = layers.find((l: any) => l.route?.path === path && l.route?.methods?.get)
  if (!layer?.route) throw new Error(`GET ${path} route not found`)
  const handlers = layer.route.stack
  return handlers[handlers.length - 1].handle
}

describe('movie routes - GET /:id', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('maps all fields from snake_case to camelCase', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 550, title: 'Fight Club', tagline: 'Mischief. Mayhem. Soap.',
        overview: 'An insomniac office worker.', poster_path: '/fc.jpg',
        backdrop_path: '/fc_bg.jpg', release_date: '1999-10-15', runtime: 139,
        vote_average: 8.4, vote_count: 25000, budget: 63000000, revenue: 101209702,
        status: 'Released',
        genres: [{ id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
        production_companies: [
          { id: 508, name: 'Regency Enterprises', logo_path: '/regency.png' },
          { id: 711, name: 'Fox 2000 Pictures', logo_path: null },
        ],
      },
    })

    const handler = await getRouteHandler('/:id')
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as Record<string, unknown>
    expect(body.id).toBe(550)
    expect(body.title).toBe('Fight Club')
    expect(body.tagline).toBe('Mischief. Mayhem. Soap.')
    expect(body.posterPath).toBe('/fc.jpg')
    expect(body.backdropPath).toBe('/fc_bg.jpg')
    expect(body.releaseDate).toBe('1999-10-15')
    expect(body.runtime).toBe(139)
    expect(body.voteAverage).toBe(8.4)
    expect(body.voteCount).toBe(25000)
    expect(body.budget).toBe(63000000)
    expect(body.revenue).toBe(101209702)
    expect(body.genres).toEqual([{ id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }])
    expect(body.productionCompanies).toEqual([
      { id: 508, name: 'Regency Enterprises', logoPath: '/regency.png' },
      { id: 711, name: 'Fox 2000 Pictures', logoPath: null },
    ])
  })

  it('handles missing optional fields with null/zero defaults', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 999, title: 'Unknown Movie', tagline: '', overview: '',
        poster_path: null, backdrop_path: null, release_date: '', runtime: 0,
        vote_average: 0, vote_count: 0, budget: 0, revenue: 0, status: 'Rumored',
        genres: [], production_companies: [],
      },
    })

    const handler = await getRouteHandler('/:id')
    const req = createMockReq({ id: '999' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as Record<string, unknown>
    expect(body.posterPath).toBeNull()
    expect(body.backdropPath).toBeNull()
    expect(body.budget).toBe(0)
    expect(body.revenue).toBe(0)
  })

  it('calls next with error when tmdbClient.get rejects', async () => {
    const error = new Error('Not found')
    mockGet.mockRejectedValue(error)

    const handler = await getRouteHandler('/:id')
    const req = createMockReq({ id: '999' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('movie routes - GET /:id/credits', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('filters crew by keyRoles', async () => {
    mockGet.mockResolvedValue({
      data: {
        cast: [],
        crew: [
          { id: 1, name: 'David Fincher', job: 'Director', department: 'Directing', profile_path: '/fincher.jpg' },
          { id: 2, name: 'Jim Uhls', job: 'Screenplay', department: 'Writing', profile_path: null },
          { id: 3, name: 'Random Gaffer', job: 'Gaffer', department: 'Lighting', profile_path: null },
          { id: 4, name: 'Key Grip', job: 'Key Grip', department: 'Camera', profile_path: null },
          { id: 5, name: 'John Doe', job: 'Producer', department: 'Production', profile_path: '/doe.jpg' },
          { id: 6, name: 'Jane Doe', job: 'Composer', department: 'Sound', profile_path: null },
        ],
      },
    })

    const handler = await getRouteHandler('/:id/credits')
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { crew: Array<{ id: number; job: string }> }
    expect(body.crew).toHaveLength(4)
    const jobs = body.crew.map(c => c.job)
    expect(jobs).toContain('Director')
    expect(jobs).toContain('Screenplay')
    expect(jobs).toContain('Producer')
    expect(jobs).toContain('Composer')
    expect(jobs).not.toContain('Gaffer')
    expect(jobs).not.toContain('Key Grip')
  })

  it('maps cast fields from snake_case to camelCase', async () => {
    mockGet.mockResolvedValue({
      data: {
        cast: [
          { id: 10, name: 'Brad Pitt', character: 'Tyler Durden', profile_path: '/pitt.jpg', order: 0 },
          { id: 11, name: 'Edward Norton', character: 'The Narrator', profile_path: null, order: 1 },
        ],
        crew: [],
      },
    })

    const handler = await getRouteHandler('/:id/credits')
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { cast: Array<Record<string, unknown>> }
    expect(body.cast[0].id).toBe(10)
    expect(body.cast[0].name).toBe('Brad Pitt')
    expect(body.cast[0].character).toBe('Tyler Durden')
    expect(body.cast[0].profilePath).toBe('/pitt.jpg')
    expect(body.cast[1].profilePath).toBeNull()
  })
})

describe('movie routes - GET /:id/videos', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('filters to YouTube trailers and teasers only', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [
          { id: 'v1', key: 'abc', name: 'Official Trailer', type: 'Trailer', site: 'YouTube' },
          { id: 'v2', key: 'def', name: 'Teaser', type: 'Teaser', site: 'YouTube' },
          { id: 'v3', key: 'ghi', name: 'Behind the Scenes', type: 'Featurette', site: 'YouTube' },
          { id: 'v4', key: 'jkl', name: 'Trailer', type: 'Trailer', site: 'Vimeo' },
          { id: 'v5', key: 'mno', name: 'Clip', type: 'Clip', site: 'YouTube' },
        ],
      },
    })

    const handler = await getRouteHandler('/:id/videos')
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { videos: Array<{ id: string; type: string; site: string }> }
    expect(body.videos).toHaveLength(2)
    expect(body.videos[0].type).toBe('Trailer')
    expect(body.videos[1].type).toBe('Teaser')
  })

  it('returns empty videos array when no results match', async () => {
    mockGet.mockResolvedValue({
      data: { results: [{ id: 'v1', key: 'abc', name: 'BTS', type: 'Featurette', site: 'YouTube' }] },
    })

    const handler = await getRouteHandler('/:id/videos')
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { videos: Array<Record<string, unknown>> }
    expect(body.videos).toHaveLength(0)
  })
})

describe('movie routes - GET /:id/similar', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('limits similar movies to 10', async () => {
    const movies = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1, title: `Movie ${i + 1}`, poster_path: `/m${i}.jpg`,
      vote_average: 7.0, release_date: '2024-01-01',
    }))

    mockGet.mockResolvedValue({ data: { results: movies } })

    const handler = await getRouteHandler('/:id/similar')
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<Record<string, unknown>> }
    expect(body.results).toHaveLength(10)
  })

  it('maps similar movie fields from snake_case to camelCase', async () => {
    mockGet.mockResolvedValue({
      data: { results: [{ id: 1, title: 'Similar Movie', poster_path: '/sim.jpg', vote_average: 6.5, release_date: '2020-06-15' }] },
    })

    const handler = await getRouteHandler('/:id/similar')
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<Record<string, unknown>> }
    expect(body.results[0]).toEqual({
      id: 1, title: 'Similar Movie', posterPath: '/sim.jpg', voteAverage: 6.5, releaseDate: '2020-06-15',
    })
  })
})

describe('movie routes - GET /:id/recommendations', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('limits recommendations to 10', async () => {
    const movies = Array.from({ length: 15 }, (_, i) => ({
      id: i + 100, title: `Recommended ${i + 1}`, poster_path: `/r${i}.jpg`,
      vote_average: 7.5, release_date: '2024-01-01',
    }))

    mockGet.mockResolvedValue({ data: { results: movies } })

    const handler = await getRouteHandler('/:id/recommendations')
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<Record<string, unknown>> }
    expect(body.results).toHaveLength(10)
  })

  it('maps recommendation fields correctly', async () => {
    mockGet.mockResolvedValue({
      data: { results: [{ id: 100, title: 'Good Movie', poster_path: null, vote_average: 8.0, release_date: null }] },
    })

    const handler = await getRouteHandler('/:id/recommendations')
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<Record<string, unknown>> }
    expect(body.results[0]).toEqual({
      id: 100, title: 'Good Movie', posterPath: null, voteAverage: 8.0, releaseDate: null,
    })
  })
})
