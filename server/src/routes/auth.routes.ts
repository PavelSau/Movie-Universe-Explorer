import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../services/db.js'
import { config } from '../config.js'

const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required', code: 400 })
      return
    }

    const result = await pool.query(
      'SELECT id, username, password_hash, display_name FROM users WHERE username = $1',
      [username],
    )

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid username or password', code: 401 })
      return
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password', code: 401 })
      return
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: '7d' },
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, displayName } = req.body

    if (!username || !password || !displayName) {
      res.status(400).json({ error: 'Username, password, and display name are required', code: 400 })
      return
    }

    if (username.length < 3 || password.length < 6) {
      res.status(400).json({ error: 'Username must be 3+ chars, password 6+ chars', code: 400 })
      return
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username])
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Username already taken', code: 409 })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, username, display_name',
      [username, passwordHash, displayName],
    )

    const user = result.rows[0]
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: '7d' },
    )

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Not authenticated', code: 401 })
      return
    }

    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number; username: string }

    const result = await pool.query(
      'SELECT id, username, display_name FROM users WHERE id = $1',
      [decoded.userId],
    )

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found', code: 401 })
      return
    }

    const user = result.rows[0]
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
    })
  } catch {
    res.status(401).json({ error: 'Invalid token', code: 401 })
  }
})

export { router as authRoutes }
