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
async function getRouteHandler(): Promise<(req: any, res: any, next: any) => Promise<void>> {
  const mod = await import('./providers.routes.js')
  const router = mod.providersRoutes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (router as any).stack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = layers.find((l: any) => l.route?.path === '/:id' && l.route?.methods?.get)
  if (!layer?.route) throw new Error('GET /:id route not found')
  const handlers = layer.route.stack
  return handlers[handlers.length - 1].handle
}

describe('providers routes - GET /:id', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('maps US providers with stream, rent, and buy categories', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: {
          US: {
            link: 'https://www.themoviedb.org/movie/550/watch',
            flatrate: [
              { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' },
            ],
            rent: [
              { provider_id: 2, provider_name: 'Apple TV', logo_path: '/apple.png' },
            ],
            buy: [
              { provider_id: 3, provider_name: 'Google Play', logo_path: '/google.png' },
            ],
          },
          GB: {
            flatrate: [
              { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' },
            ],
          },
        },
      },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as Record<string, unknown>
    expect(body.stream).toEqual([{ id: 8, name: 'Netflix', logoPath: '/netflix.png' }])
    expect(body.rent).toEqual([{ id: 2, name: 'Apple TV', logoPath: '/apple.png' }])
    expect(body.buy).toEqual([{ id: 3, name: 'Google Play', logoPath: '/google.png' }])
    expect(body.link).toBe('https://www.themoviedb.org/movie/550/watch')
    expect(body.availableCountries).toEqual(['US', 'GB'])
  })

  it('returns empty arrays when no US providers exist', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: {
          GB: {
            flatrate: [
              { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' },
            ],
          },
        },
      },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as Record<string, unknown>
    expect(body.stream).toEqual([])
    expect(body.rent).toEqual([])
    expect(body.buy).toEqual([])
    expect(body.link).toBeNull()
    expect(body.availableCountries).toEqual(['GB'])
  })

  it('returns empty arrays when results is empty', async () => {
    mockGet.mockResolvedValue({
      data: { results: {} },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({ id: '999' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as Record<string, unknown>
    expect(body.stream).toEqual([])
    expect(body.rent).toEqual([])
    expect(body.buy).toEqual([])
    expect(body.availableCountries).toEqual([])
  })

  it('handles null logo_path in provider', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: {
          US: {
            flatrate: [
              { provider_id: 99, provider_name: 'Unknown Service', logo_path: null },
            ],
          },
        },
      },
    })

    const handler = await getRouteHandler()
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    const body = res._body as { stream: Array<Record<string, unknown>> }
    expect(body.stream[0].logoPath).toBeNull()
  })

  it('calls next with error when tmdbClient.get rejects', async () => {
    const error = new Error('API failure')
    mockGet.mockRejectedValue(error)

    const handler = await getRouteHandler()
    const req = createMockReq({ id: '550' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
