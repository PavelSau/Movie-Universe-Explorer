import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Response, NextFunction } from 'express'

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
import { requireAuth, type AuthRequest } from './auth.js'

function createMockReq(authHeader?: string): Partial<AuthRequest> {
  return {
    headers: authHeader !== undefined ? { authorization: authHeader } : {},
  } as Partial<AuthRequest>
}

function createMockRes(): {
  status: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
  _statusCode: number
  _body: unknown
} {
  const res = {
    _statusCode: 0,
    _body: undefined as unknown,
    status: vi.fn(),
    json: vi.fn(),
  }
  res.status.mockImplementation((code: number) => {
    res._statusCode = code
    return res
  })
  res.json.mockImplementation((body: unknown) => {
    res._body = body
    return res
  })
  return res
}

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no Authorization header is present', () => {
    const req = createMockReq()
    const res = createMockRes()
    const next = vi.fn()

    requireAuth(req as AuthRequest, res as unknown as Response, next as NextFunction)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
      code: 401,
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header does not start with Bearer', () => {
    const req = createMockReq('Basic abc123')
    const res = createMockRes()
    const next = vi.fn()

    requireAuth(req as AuthRequest, res as unknown as Response, next as NextFunction)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
      code: 401,
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token is invalid (jwt.verify throws)', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('invalid token')
    })

    const req = createMockReq('Bearer invalid-token')
    const res = createMockRes()
    const next = vi.fn()

    requireAuth(req as AuthRequest, res as unknown as Response, next as NextFunction)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token',
      code: 401,
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next() and sets userId/username when token is valid', () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: 42,
      username: 'testuser',
    } as unknown as ReturnType<typeof jwt.verify>)

    const req = createMockReq('Bearer valid-token')
    const res = createMockRes()
    const next = vi.fn()

    requireAuth(req as AuthRequest, res as unknown as Response, next as NextFunction)

    expect(next).toHaveBeenCalledOnce()
    expect((req as AuthRequest).userId).toBe(42)
    expect((req as AuthRequest).username).toBe('testuser')
    expect(res.status).not.toHaveBeenCalled()
  })

  it('passes the correct token string to jwt.verify', () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: 1,
      username: 'user',
    } as unknown as ReturnType<typeof jwt.verify>)

    const req = createMockReq('Bearer my-specific-token')
    const res = createMockRes()
    const next = vi.fn()

    requireAuth(req as AuthRequest, res as unknown as Response, next as NextFunction)

    expect(jwt.verify).toHaveBeenCalledWith('my-specific-token', 'test-secret')
  })
})
