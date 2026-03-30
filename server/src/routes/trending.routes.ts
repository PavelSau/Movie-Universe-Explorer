import { Router } from 'express'
import { tmdbClient } from '../services/tmdb.js'
import { cacheMiddleware } from '../middleware/cache.js'

const router = Router()

router.get('/', cacheMiddleware(900), async (req, res, next) => {
  try {
    const { window = 'day' } = req.query
    const timeWindow = window === 'week' ? 'week' : 'day'

    const response = await tmdbClient.get(`/trending/movie/${timeWindow}`)

    const results = response.data.results.map((item: Record<string, unknown>) => ({
      id: item.id,
      title: item.title,
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      releaseDate: item.release_date,
      overview: item.overview,
      voteAverage: item.vote_average,
      genreIds: item.genre_ids,
      popularity: item.popularity,
    }))

    res.json({ results, timeWindow })
  } catch (err) {
    next(err)
  }
})

router.get('/people', cacheMiddleware(900), async (req, res, next) => {
  try {
    const { window = 'day' } = req.query
    const timeWindow = window === 'week' ? 'week' : 'day'

    const response = await tmdbClient.get(`/trending/person/${timeWindow}`)

    const results = response.data.results.map((item: Record<string, unknown>) => ({
      id: item.id,
      name: item.name,
      profilePath: item.profile_path,
      knownForDepartment: item.known_for_department,
      popularity: item.popularity,
    }))

    res.json({ results, timeWindow })
  } catch (err) {
    next(err)
  }
})

export { router as trendingRoutes }
