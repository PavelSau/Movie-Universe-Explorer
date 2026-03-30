import { Router } from 'express'
import { tmdbClient } from '../services/tmdb.js'
import { cacheMiddleware } from '../middleware/cache.js'

const router = Router()

router.get('/', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const {
      with_genres,
      'primary_release_date.gte': releaseDateGte,
      'primary_release_date.lte': releaseDateLte,
      sort_by = 'vote_average.desc',
      page = '1',
      'vote_count.gte': voteCountGte = '50',
    } = req.query

    const params: Record<string, string | number> = {
      sort_by: String(sort_by),
      page: Number(page),
      'vote_count.gte': Number(voteCountGte),
    }

    if (with_genres) {
      params.with_genres = String(with_genres)
    }
    if (releaseDateGte) {
      params['primary_release_date.gte'] = String(releaseDateGte)
    }
    if (releaseDateLte) {
      params['primary_release_date.lte'] = String(releaseDateLte)
    }

    const response = await tmdbClient.get('/discover/movie', { params })

    const results = response.data.results.map((item: Record<string, unknown>) => ({
      id: item.id,
      title: item.title,
      posterPath: item.poster_path,
      releaseDate: item.release_date,
      voteAverage: item.vote_average,
      genreIds: item.genre_ids,
      popularity: item.popularity,
    }))

    res.json({
      results,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results,
    })
  } catch (err) {
    next(err)
  }
})

export { router as discoverRoutes }
