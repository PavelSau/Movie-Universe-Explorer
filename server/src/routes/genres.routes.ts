import { Router } from 'express'
import { tmdbClient } from '../services/tmdb.js'
import { cacheMiddleware } from '../middleware/cache.js'

const router = Router()

router.get('/', cacheMiddleware(86400), async (_req, res, next) => {
  try {
    const response = await tmdbClient.get('/genre/movie/list')

    res.json({
      genres: response.data.genres.map((g: { id: number; name: string }) => ({
        id: g.id,
        name: g.name,
      })),
    })
  } catch (err) {
    next(err)
  }
})

export { router as genresRoutes }
