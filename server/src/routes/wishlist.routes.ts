import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../services/db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const entityTypeSchema = z.enum(['movie', 'person'])

const wishlistCheckSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.coerce.number().int().positive(),
})

const wishlistAddSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.number().int().positive(),
  title: z.string().min(1),
  posterPath: z.string().nullable().optional(),
})

const wishlistRemoveSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.number().int().positive(),
})

const router = Router()

// All wishlist routes require auth
router.use(requireAuth)

// Get user's wishlist (optionally filter by type)
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { type } = req.query
    let query = 'SELECT id, entity_type, entity_id, title, poster_path, created_at FROM wishlists WHERE user_id = $1'
    const params: (number | string)[] = [req.userId!]

    if (type === 'movie' || type === 'person') {
      query += ' AND entity_type = $2'
      params.push(type)
    }

    query += ' ORDER BY created_at DESC'
    const result = await pool.query(query, params)

    res.json({
      items: result.rows.map((r) => ({
        id: r.id,
        entityType: r.entity_type,
        entityId: r.entity_id,
        title: r.title,
        posterPath: r.poster_path,
        createdAt: r.created_at,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// Check if an entity is in the wishlist
router.get('/check', async (req: AuthRequest, res, next) => {
  try {
    const parsed = wishlistCheckSchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'entityType and entityId are required', code: 400 })
      return
    }

    const { entityType, entityId } = parsed.data

    const result = await pool.query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3',
      [req.userId!, entityType, entityId],
    )

    res.json({ inWishlist: result.rows.length > 0 })
  } catch (err) {
    next(err)
  }
})

// Add to wishlist
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const parsed = wishlistAddSchema.safeParse(req.body)
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      if (errors.entityType) {
        res.status(400).json({ error: 'entityType must be movie or person', code: 400 })
        return
      }
      res.status(400).json({ error: 'entityType, entityId, and title are required', code: 400 })
      return
    }

    const { entityType, entityId, title, posterPath } = parsed.data

    const result = await pool.query(
      `INSERT INTO wishlists (user_id, entity_type, entity_id, title, poster_path)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING
       RETURNING id, entity_type, entity_id, title, poster_path, created_at`,
      [req.userId!, entityType, entityId, title, posterPath || null],
    )

    if (result.rows.length === 0) {
      res.json({ message: 'Already in wishlist' })
      return
    }

    const r = result.rows[0]
    res.status(201).json({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      title: r.title,
      posterPath: r.poster_path,
      createdAt: r.created_at,
    })
  } catch (err) {
    next(err)
  }
})

// Remove from wishlist
router.delete('/', async (req: AuthRequest, res, next) => {
  try {
    const parsed = wishlistRemoveSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'entityType and entityId are required', code: 400 })
      return
    }

    const { entityType, entityId } = parsed.data

    await pool.query(
      'DELETE FROM wishlists WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3',
      [req.userId!, entityType, entityId],
    )

    res.json({ message: 'Removed from wishlist' })
  } catch (err) {
    next(err)
  }
})

export { router as wishlistRoutes }
