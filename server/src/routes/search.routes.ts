import { Router } from 'express'
import { tmdbClient } from '../services/tmdb.js'
import { cacheMiddleware } from '../middleware/cache.js'

const router = Router()

router.get('/', cacheMiddleware(900), async (req, res, next) => {
  try {
    const { query, page = '1' } = req.query

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ error: 'Query parameter is required', code: 400 })
      return
    }

    const response = await tmdbClient.get('/search/multi', {
      params: {
        query: query.trim(),
        page: Number(page),
        include_adult: false,
      },
    })

    const results = response.data.results
      .filter((item: { media_type: string }) =>
        item.media_type === 'movie' || item.media_type === 'person'
      )
      .map((item: Record<string, unknown>) => ({
        id: item.id,
        mediaType: item.media_type,
        title: item.title || item.name,
        posterPath: item.poster_path || item.profile_path,
        releaseDate: item.release_date || null,
        overview: item.overview || null,
        voteAverage: item.vote_average || null,
        knownForDepartment: item.known_for_department || null,
      }))

    res.json({
      results,
      page: response.data.page,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results,
    })
  } catch (err) {
    next(err)
  }
})

export { router as searchRoutes }
