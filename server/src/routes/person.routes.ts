import { Router } from 'express'
import { tmdbClient } from '../services/tmdb.js'
import { cacheMiddleware } from '../middleware/cache.js'

const router = Router()

router.get('/:id', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const { id } = req.params
    const response = await tmdbClient.get(`/person/${id}`)
    const p = response.data

    res.json({
      id: p.id,
      name: p.name,
      biography: p.biography || null,
      birthday: p.birthday || null,
      deathday: p.deathday || null,
      placeOfBirth: p.place_of_birth || null,
      profilePath: p.profile_path || null,
      knownForDepartment: p.known_for_department || null,
      popularity: p.popularity,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/credits', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const { id } = req.params
    const response = await tmdbClient.get(`/person/${id}/combined_credits`)

    const seenCast = new Set<number>()
    const cast = (response.data.cast || [])
      .filter((c: Record<string, unknown>) => {
        if (seenCast.has(c.id as number)) return false
        seenCast.add(c.id as number)
        return true
      })
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        (b.popularity as number) - (a.popularity as number)
      )
      .map((c: Record<string, unknown>) => ({
        id: c.id,
        title: c.title || c.name,
        mediaType: c.media_type,
        character: c.character || null,
        posterPath: c.poster_path || null,
        releaseDate: c.release_date || c.first_air_date || null,
        voteAverage: c.vote_average || null,
        popularity: c.popularity || 0,
      }))

    const seenCrew = new Set<number>()
    const crew = (response.data.crew || [])
      .filter((c: Record<string, unknown>) => {
        if (seenCrew.has(c.id as number)) return false
        seenCrew.add(c.id as number)
        return true
      })
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        (b.popularity as number) - (a.popularity as number)
      )
      .map((c: Record<string, unknown>) => ({
        id: c.id,
        title: c.title || c.name,
        mediaType: c.media_type,
        job: c.job || null,
        department: c.department || null,
        posterPath: c.poster_path || null,
        releaseDate: c.release_date || c.first_air_date || null,
        voteAverage: c.vote_average || null,
        popularity: c.popularity || 0,
      }))

    res.json({ cast, crew })
  } catch (err) {
    next(err)
  }
})

export { router as personRoutes }
