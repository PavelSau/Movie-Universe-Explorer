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
    const response = await tmdbClient.get(`/movie/${id}`)
    const m = response.data

    res.json({
      id: m.id,
      title: m.title,
      tagline: m.tagline || null,
      overview: m.overview || null,
      posterPath: m.poster_path || null,
      backdropPath: m.backdrop_path || null,
      releaseDate: m.release_date || null,
      runtime: m.runtime || null,
      voteAverage: m.vote_average,
      voteCount: m.vote_count,
      budget: m.budget || 0,
      revenue: m.revenue || 0,
      status: m.status,
      genres: (m.genres || []).map((g: { id: number; name: string }) => ({
        id: g.id,
        name: g.name,
      })),
      productionCompanies: (m.production_companies || []).map(
        (c: { id: number; name: string; logo_path: string | null }) => ({
          id: c.id,
          name: c.name,
          logoPath: c.logo_path || null,
        })
      ),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/credits', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid ID', code: 400 })
      return
    }
    const response = await tmdbClient.get(`/movie/${id}/credits`)

    const cast = (response.data.cast || [])
      .map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        character: c.character || '',
        profilePath: c.profile_path || null,
        order: c.order,
      }))

    const keyRoles = [
      'Director', 'Writer', 'Screenplay', 'Story', 'Producer', 'Executive Producer',
      'Director of Photography', 'Original Music Composer', 'Composer', 'Editor',
      'Production Design', 'Costume Design', 'Casting',
    ]
    const crew = (response.data.crew || [])
      .filter((c: Record<string, unknown>) => keyRoles.includes(c.job as string))
      .map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        job: c.job,
        department: c.department,
        profilePath: c.profile_path || null,
      }))

    res.json({ cast, crew })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/videos', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid ID', code: 400 })
      return
    }
    const response = await tmdbClient.get(`/movie/${id}/videos`)

    const videos = (response.data.results || [])
      .filter(
        (v: Record<string, unknown>) =>
          (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
      )
      .map((v: Record<string, unknown>) => ({
        id: v.id,
        key: v.key,
        name: v.name,
        type: v.type,
        site: v.site,
      }))

    res.json({ videos })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/similar', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid ID', code: 400 })
      return
    }
    const response = await tmdbClient.get(`/movie/${id}/similar`)
    const results = (response.data.results || [])
      .slice(0, 10)
      .map((m: Record<string, unknown>) => ({
        id: m.id,
        title: m.title,
        posterPath: m.poster_path || null,
        voteAverage: m.vote_average,
        releaseDate: m.release_date || null,
      }))

    res.json({ results })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/recommendations', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid ID', code: 400 })
      return
    }
    const response = await tmdbClient.get(`/movie/${id}/recommendations`)
    const results = (response.data.results || [])
      .slice(0, 10)
      .map((m: Record<string, unknown>) => ({
        id: m.id,
        title: m.title,
        posterPath: m.poster_path || null,
        voteAverage: m.vote_average,
        releaseDate: m.release_date || null,
      }))

    res.json({ results })
  } catch (err) {
    next(err)
  }
})

export { router as movieRoutes }
