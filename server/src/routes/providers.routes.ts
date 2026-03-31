import { Router } from 'express'
import { tmdbClient } from '../services/tmdb.js'
import { cacheMiddleware } from '../middleware/cache.js'

const router = Router()

router.get('/:id', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid ID', code: 400 })
      return
    }
    const response = await tmdbClient.get(`/movie/${id}/watch/providers`)
    const results = response.data.results || {}

    // Return US providers by default, with all available countries
    const us = results.US || {}

    const mapProvider = (p: Record<string, unknown>) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path || null,
    })

    res.json({
      stream: (us.flatrate || []).map(mapProvider),
      rent: (us.rent || []).map(mapProvider),
      buy: (us.buy || []).map(mapProvider),
      link: us.link || null,
      availableCountries: Object.keys(results),
    })
  } catch (err) {
    next(err)
  }
})

export { router as providersRoutes }
