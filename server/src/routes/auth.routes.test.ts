import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockQuery = vi.fn()

vi.mock('../services/db.js', () => ({
  pool: { query: (...args: unknown[]) => mockQuery(...args) },
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}))

vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test-secret',
  },
}))

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

function createMockReq(body: Record<string, unknown> = {}, headers: Record<string, string> = {}): Record<string, unknown> {
  return { body, headers }
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
async function getRouteHandler(path: string, method: string): Promise<(req: any, res: any, next: any) => Promise<void>> {
  const mod = await import('./auth.routes.js')
  const router = mod.authRoutes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (router as any).stack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = layers.find((l: any) => l.route?.path === path && l.route?.methods?.[method])
  if (!layer?.route) throw new Error(`${method.toUpperCase()} ${path} route not found`)
  const handlers = layer.route.stack
  return handlers[handlers.length - 1].handle
}

describe('auth routes - POST /login', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when username is missing', async () => {
    const handler = await getRouteHandler('/login', 'post')
    const req = createMockReq({ password: 'pass123' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res._body).toEqual({ error: 'Username and password are required', code: 400 })
  })

  it('returns 400 when password is missing', async () => {
    const handler = await getRouteHandler('/login', 'post')
    const req = createMockReq({ username: 'john' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 401 when user is not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const handler = await getRouteHandler('/login', 'post')
    const req = createMockReq({ username: 'nonexistent', password: 'pass123' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res._body).toEqual({ error: 'Invalid username or password', code: 401 })
  })

  it('returns 401 when password is incorrect', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'john', password_hash: '$2a$10$hash', display_name: 'John' }],
    })
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never)

    const handler = await getRouteHandler('/login', 'post')
    const req = createMockReq({ username: 'john', password: 'wrongpass' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res._body).toEqual({ error: 'Invalid username or password', code: 401 })
  })

  it('returns token and user on successful login', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'john', password_hash: '$2a$10$hash', display_name: 'John Doe' }],
    })
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)
    vi.mocked(jwt.sign).mockReturnValueOnce('mock-jwt-token' as never)

    const handler = await getRouteHandler('/login', 'post')
    const req = createMockReq({ username: 'john', password: 'pass123' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res._body).toEqual({
      token: 'mock-jwt-token',
      user: { id: 1, username: 'john', displayName: 'John Doe' },
    })
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: 1, username: 'john' },
      'test-secret',
      { expiresIn: '7d' },
    )
  })

  it('calls next with error when database query fails', async () => {
    const error = new Error('Database connection lost')
    mockQuery.mockRejectedValueOnce(error)

    const handler = await getRouteHandler('/login', 'post')
    const req = createMockReq({ username: 'john', password: 'pass123' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('auth routes - POST /register', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when required fields are missing', async () => {
    const handler = await getRouteHandler('/register', 'post')
    const req = createMockReq({ username: 'john', password: 'pass123' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res._body).toEqual({
      error: 'Username, password, and display name are required',
      code: 400,
    })
  })

  it('returns 400 when username is too short', async () => {
    const handler = await getRouteHandler('/register', 'post')
    const req = createMockReq({ username: 'ab', password: 'pass123', displayName: 'AB' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res._body).toEqual({
      error: 'Username must be 3+ chars, password 6+ chars',
      code: 400,
    })
  })

  it('returns 400 when password is too short', async () => {
    const handler = await getRouteHandler('/register', 'post')
    const req = createMockReq({ username: 'john', password: '12345', displayName: 'John' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 409 when username already exists', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] })

    const handler = await getRouteHandler('/register', 'post')
    const req = createMockReq({ username: 'john', password: 'pass123', displayName: 'John' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res._body).toEqual({ error: 'Username already taken', code: 409 })
  })

  it('returns 201 with token and user on successful registration', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // existing user check
      .mockResolvedValueOnce({
        rows: [{ id: 5, username: 'newuser', display_name: 'New User' }],
      }) // insert
    vi.mocked(bcrypt.hash).mockResolvedValueOnce('$2a$10$newhash' as never)
    vi.mocked(jwt.sign).mockReturnValueOnce('new-jwt-token' as never)

    const handler = await getRouteHandler('/register', 'post')
    const req = createMockReq({ username: 'newuser', password: 'pass123', displayName: 'New User' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res._body).toEqual({
      token: 'new-jwt-token',
      user: { id: 5, username: 'newuser', displayName: 'New User' },
    })
  })

  it('calls next with error when database query fails', async () => {
    const error = new Error('DB error')
    mockQuery.mockRejectedValueOnce(error)

    const handler = await getRouteHandler('/register', 'post')
    const req = createMockReq({ username: 'john', password: 'pass123', displayName: 'John' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('auth routes - GET /me', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when no Authorization header is present', async () => {
    const handler = await getRouteHandler('/me', 'get')
    const req = createMockReq({}, {})
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res._body).toEqual({ error: 'Not authenticated', code: 401 })
  })

  it('returns 401 when Authorization header is not Bearer type', async () => {
    const handler = await getRouteHandler('/me', 'get')
    const req = createMockReq({}, { authorization: 'Basic abc123' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 401 when token is invalid', async () => {
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error('invalid token')
    })

    const handler = await getRouteHandler('/me', 'get')
    const req = createMockReq({}, { authorization: 'Bearer bad-token' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res._body).toEqual({ error: 'Invalid token', code: 401 })
  })

  it('returns 401 when user is not found in database', async () => {
    vi.mocked(jwt.verify).mockReturnValueOnce({ userId: 99, username: 'ghost' } as never)
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const handler = await getRouteHandler('/me', 'get')
    const req = createMockReq({}, { authorization: 'Bearer valid-token' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res._body).toEqual({ error: 'User not found', code: 401 })
  })

  it('returns user data when token is valid and user exists', async () => {
    vi.mocked(jwt.verify).mockReturnValueOnce({ userId: 1, username: 'john' } as never)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'john', display_name: 'John Doe' }],
    })

    const handler = await getRouteHandler('/me', 'get')
    const req = createMockReq({}, { authorization: 'Bearer valid-token' })
    const res = createMockRes()
    const next = vi.fn()

    await handler(req, res, next)

    expect(res._body).toEqual({
      id: 1,
      username: 'john',
      displayName: 'John Doe',
    })
  })
})
