import { Router } from 'express'
import { pool } from '../services/db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

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
    const { entityType, entityId } = req.query

    if (!entityType || !entityId) {
      res.status(400).json({ error: 'entityType and entityId are required', code: 400 })
      return
    }

    const result = await pool.query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3',
      [req.userId!, entityType, Number(entityId)],
    )

    res.json({ inWishlist: result.rows.length > 0 })
  } catch (err) {
    next(err)
  }
})

// Add to wishlist
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { entityType, entityId, title, posterPath } = req.body

    if (!entityType || !entityId || !title) {
      res.status(400).json({ error: 'entityType, entityId, and title are required', code: 400 })
      return
    }

    if (entityType !== 'movie' && entityType !== 'person') {
      res.status(400).json({ error: 'entityType must be movie or person', code: 400 })
      return
    }

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
    const { entityType, entityId } = req.body

    if (!entityType || !entityId) {
      res.status(400).json({ error: 'entityType and entityId are required', code: 400 })
      return
    }

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
