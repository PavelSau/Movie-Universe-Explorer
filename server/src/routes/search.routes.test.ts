import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

const mockGet = vi.fn()

vi.mock('../services/tmdb.js', () => ({
  tmdbClient: { get: mockGet },
}))

vi.mock('../middleware/cache.js', () => ({
  cacheMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}))

function createMockReq(query: Record<string, string | undefined> = {}): Partial<Request> {
  return { query }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRouteHandler(): Promise<(req: any, res: any, next: any) => Promise<void>> {
  const mod = await import('./search.routes.js')
  const router = mod.searchRoutes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (router as any).stack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLayer = layers.find((l: any) => l.route?.path === '/' && l.route?.methods?.get)
  if (!getLayer?.route) throw new Error('GET / route not found')
  const handlers = getLayer.route.stack
  return handlers[handlers.length - 1].handle
}

describe('search routes - GET /', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when query is missing', async () => {
    const handler = await getRouteHandler()
    const req = createMockReq({})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Query parameter is required',
      code: 400,
    })
  })

  it('returns 400 when query is empty string', async () => {
    const handler = await getRouteHandler()
    const req = createMockReq({ query: '' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when query is whitespace only', async () => {
    const handler = await getRouteHandler()
    const req = createMockReq({ query: '   ' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('filters results to only movie and person types', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [
          { id: 1, media_type: 'movie', title: 'Batman', poster_path: '/batman.jpg' },
          { id: 2, media_type: 'tv', name: 'Breaking Bad' },
          { id: 3, media_type: 'person', name: 'Christian Bale', profile_path: '/bale.jpg' },
        ],
        page: 1,
        total_pages: 1,
        total_results: 3,
      },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({ query: 'batman' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<{ id: number; mediaType: string }> }
    expect(body.results).toHaveLength(2)
    expect(body.results[0].mediaType).toBe('movie')
    expect(body.results[1].mediaType).toBe('person')
  })

  it('maps TMDb snake_case to camelCase correctly', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [
          {
            id: 1, media_type: 'movie', title: 'Inception',
            poster_path: '/inception.jpg', release_date: '2010-07-16',
            overview: 'A thief steals secrets.', vote_average: 8.4,
            known_for_department: null,
          },
        ],
        page: 1, total_pages: 5, total_results: 50,
      },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({ query: 'inception' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<Record<string, unknown>>; page: number; totalPages: number; totalResults: number }
    const result = body.results[0]
    expect(result.id).toBe(1)
    expect(result.mediaType).toBe('movie')
    expect(result.title).toBe('Inception')
    expect(result.posterPath).toBe('/inception.jpg')
    expect(result.releaseDate).toBe('2010-07-16')
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(5)
    expect(body.totalResults).toBe(50)
  })

  it('uses profile_path for person posterPath', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [
          { id: 1, media_type: 'person', name: 'Tom Hanks', profile_path: '/hanks.jpg', known_for_department: 'Acting' },
        ],
        page: 1, total_pages: 1, total_results: 1,
      },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({ query: 'tom hanks' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { results: Array<Record<string, unknown>> }
    expect(body.results[0].posterPath).toBe('/hanks.jpg')
    expect(body.results[0].knownForDepartment).toBe('Acting')
  })

  it('calls next with error when tmdbClient.get rejects', async () => {
    const error = new Error('Network failure')
    mockGet.mockRejectedValue(error)

    const handler = await getRouteHandler()
    const req = createMockReq({ query: 'batman' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
