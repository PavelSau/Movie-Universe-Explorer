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
  const mod = await import('./person.routes.js')
  const router = mod.personRoutes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (router as any).stack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = layers.find((l: any) => l.route?.path === path && l.route?.methods?.get)
  if (!layer?.route) throw new Error(`GET ${path} route not found`)
  const handlers = layer.route.stack
  return handlers[handlers.length - 1].handle
}

describe('person routes - GET /:id', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('maps person detail fields from snake_case to camelCase', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 287,
        name: 'Brad Pitt',
        biography: 'An American actor.',
        birthday: '1963-12-18',
        deathday: null,
        place_of_birth: 'Shawnee, Oklahoma, USA',
        profile_path: '/pitt.jpg',
        known_for_department: 'Acting',
        popularity: 50.5,
      },
    })

    const handler = await getRouteHandler('/:id')
    const req = createMockReq({ id: '287' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as Record<string, unknown>
    expect(body.id).toBe(287)
    expect(body.name).toBe('Brad Pitt')
    expect(body.biography).toBe('An American actor.')
    expect(body.birthday).toBe('1963-12-18')
    expect(body.deathday).toBeNull()
    expect(body.placeOfBirth).toBe('Shawnee, Oklahoma, USA')
    expect(body.profilePath).toBe('/pitt.jpg')
    expect(body.knownForDepartment).toBe('Acting')
    expect(body.popularity).toBe(50.5)
  })

  it('defaults empty/missing fields to null', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 999,
        name: 'Unknown Person',
        biography: '',
        birthday: null,
        deathday: null,
        place_of_birth: null,
        profile_path: null,
        known_for_department: null,
        popularity: 0,
      },
    })

    const handler = await getRouteHandler('/:id')
    const req = createMockReq({ id: '999' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as Record<string, unknown>
    expect(body.biography).toBeNull()
    expect(body.birthday).toBeNull()
    expect(body.profilePath).toBeNull()
    expect(body.knownForDepartment).toBeNull()
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

describe('person routes - GET /:id/credits', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('deduplicates cast entries by id', async () => {
    mockGet.mockResolvedValue({
      data: {
        cast: [
          { id: 100, title: 'Movie A', media_type: 'movie', character: 'Hero', poster_path: '/a.jpg', release_date: '2020-01-01', vote_average: 7.5, popularity: 50, genre_ids: [28] },
          { id: 100, title: 'Movie A', media_type: 'movie', character: 'Hero', poster_path: '/a.jpg', release_date: '2020-01-01', vote_average: 7.5, popularity: 50, genre_ids: [28] },
          { id: 200, title: 'Movie B', media_type: 'movie', character: 'Villain', poster_path: '/b.jpg', release_date: '2021-06-15', vote_average: 8.0, popularity: 40, genre_ids: [18] },
        ],
        crew: [],
      },
    })

    const handler = await getRouteHandler('/:id/credits')
    const req = createMockReq({ id: '287' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { cast: Array<{ id: number }> }
    expect(body.cast).toHaveLength(2)
    expect(body.cast[0].id).toBe(100)
    expect(body.cast[1].id).toBe(200)
  })

  it('maps cast fields from snake_case to camelCase', async () => {
    mockGet.mockResolvedValue({
      data: {
        cast: [
          { id: 550, title: 'Fight Club', media_type: 'movie', character: 'Tyler Durden', poster_path: '/fc.jpg', release_date: '1999-10-15', vote_average: 8.4, popularity: 60, genre_ids: [18, 53] },
        ],
        crew: [],
      },
    })

    const handler = await getRouteHandler('/:id/credits')
    const req = createMockReq({ id: '287' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { cast: Array<Record<string, unknown>> }
    const castItem = body.cast[0]
    expect(castItem.id).toBe(550)
    expect(castItem.title).toBe('Fight Club')
    expect(castItem.mediaType).toBe('movie')
    expect(castItem.character).toBe('Tyler Durden')
    expect(castItem.posterPath).toBe('/fc.jpg')
    expect(castItem.releaseDate).toBe('1999-10-15')
    expect(castItem.voteAverage).toBe(8.4)
    expect(castItem.popularity).toBe(60)
    expect(castItem.genreIds).toEqual([18, 53])
  })

  it('sorts cast by popularity descending', async () => {
    mockGet.mockResolvedValue({
      data: {
        cast: [
          { id: 1, title: 'Low Pop', media_type: 'movie', character: 'A', poster_path: null, release_date: '2020-01-01', vote_average: 5.0, popularity: 10, genre_ids: [] },
          { id: 2, title: 'High Pop', media_type: 'movie', character: 'B', poster_path: null, release_date: '2020-01-01', vote_average: 7.0, popularity: 100, genre_ids: [] },
          { id: 3, title: 'Med Pop', media_type: 'movie', character: 'C', poster_path: null, release_date: '2020-01-01', vote_average: 6.0, popularity: 50, genre_ids: [] },
        ],
        crew: [],
      },
    })

    const handler = await getRouteHandler('/:id/credits')
    const req = createMockReq({ id: '287' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { cast: Array<{ id: number; popularity: number }> }
    expect(body.cast[0].popularity).toBe(100)
    expect(body.cast[1].popularity).toBe(50)
    expect(body.cast[2].popularity).toBe(10)
  })

  it('maps crew fields and deduplicates by id', async () => {
    mockGet.mockResolvedValue({
      data: {
        cast: [],
        crew: [
          { id: 10, title: 'Film A', media_type: 'movie', job: 'Producer', department: 'Production', poster_path: '/p.jpg', release_date: '2019-03-22', vote_average: 6.0, popularity: 30, genre_ids: [35] },
          { id: 10, title: 'Film A', media_type: 'movie', job: 'Director', department: 'Directing', poster_path: '/p.jpg', release_date: '2019-03-22', vote_average: 6.0, popularity: 30, genre_ids: [35] },
          { id: 20, title: 'Film B', media_type: 'movie', job: 'Director', department: 'Directing', poster_path: null, release_date: '2022-11-01', vote_average: 7.0, popularity: 60, genre_ids: [18] },
        ],
      },
    })

    const handler = await getRouteHandler('/:id/credits')
    const req = createMockReq({ id: '287' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { crew: Array<Record<string, unknown>> }
    expect(body.crew).toHaveLength(2)
    expect(body.crew[0].id).toBe(20) // higher popularity first
    expect(body.crew[0].job).toBe('Director')
    expect(body.crew[0].department).toBe('Directing')
    expect(body.crew[0].posterPath).toBeNull()
    expect(body.crew[1].id).toBe(10)
  })

  it('uses name as fallback title for TV shows', async () => {
    mockGet.mockResolvedValue({
      data: {
        cast: [
          { id: 500, name: 'TV Show Name', media_type: 'tv', character: 'Guest', poster_path: null, first_air_date: '2023-05-01', vote_average: 7.0, popularity: 20, genre_ids: [] },
        ],
        crew: [],
      },
    })

    const handler = await getRouteHandler('/:id/credits')
    const req = createMockReq({ id: '287' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { cast: Array<Record<string, unknown>> }
    expect(body.cast[0].title).toBe('TV Show Name')
    expect(body.cast[0].releaseDate).toBe('2023-05-01')
  })

  it('calls next with error when tmdbClient.get rejects', async () => {
    const error = new Error('API failure')
    mockGet.mockRejectedValue(error)

    const handler = await getRouteHandler('/:id/credits')
    const req = createMockReq({ id: '287' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
