import type { Request, Response, NextFunction } from 'express'
import { AxiosError } from 'axios'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[API Error]', err.message)

  if (err instanceof AxiosError) {
    const status = err.response?.status || 502
    res.status(status).json({
      error: 'TMDb API error',
      code: status,
    })
    return
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 500,
  })
}
