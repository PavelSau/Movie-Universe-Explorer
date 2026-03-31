import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { AxiosError, AxiosHeaders } from 'axios'
import { errorHandler } from './errorHandler.js'

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

describe('errorHandler', () => {
  const mockReq = {} as Request
  const mockNext = vi.fn() as NextFunction

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('returns 502 for AxiosError without response status', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK')
    const res = createMockRes()

    errorHandler(err, mockReq, res as unknown as Response, mockNext)

    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.json).toHaveBeenCalledWith({
      error: 'TMDb API error',
      code: 502,
    })
  })

  it('returns specific status for AxiosError with response status (404)', () => {
    const err = new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() },
    })
    const res = createMockRes()

    errorHandler(err, mockReq, res as unknown as Response, mockNext)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      error: 'TMDb API error',
      code: 404,
    })
  })

  it('returns specific status for AxiosError with response status (429)', () => {
    const err = new AxiosError('Too Many Requests', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 429,
      statusText: 'Too Many Requests',
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() },
    })
    const res = createMockRes()

    errorHandler(err, mockReq, res as unknown as Response, mockNext)

    expect(res.status).toHaveBeenCalledWith(429)
    expect(res.json).toHaveBeenCalledWith({
      error: 'TMDb API error',
      code: 429,
    })
  })

  it('returns 500 for generic Error', () => {
    const err = new Error('Something broke')
    const res = createMockRes()

    errorHandler(err, mockReq, res as unknown as Response, mockNext)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      code: 500,
    })
  })

  it('response body matches { error: string, code: number } shape for AxiosError', () => {
    const err = new AxiosError('Timeout', 'ECONNABORTED')
    const res = createMockRes()

    errorHandler(err, mockReq, res as unknown as Response, mockNext)

    const body = res._body as Record<string, unknown>
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('code')
    expect(typeof body.error).toBe('string')
    expect(typeof body.code).toBe('number')
  })

  it('response body matches { error: string, code: number } shape for generic Error', () => {
    const err = new Error('Unexpected')
    const res = createMockRes()

    errorHandler(err, mockReq, res as unknown as Response, mockNext)

    const body = res._body as Record<string, unknown>
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('code')
    expect(typeof body.error).toBe('string')
    expect(typeof body.code).toBe('number')
  })

  it('logs the error message', () => {
    const err = new Error('Test error message')
    const res = createMockRes()

    errorHandler(err, mockReq, res as unknown as Response, mockNext)

    expect(console.error).toHaveBeenCalledWith('[API Error]', 'Test error message')
  })
})
