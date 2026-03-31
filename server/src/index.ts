import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { config } from './config.js'
import { searchRoutes } from './routes/search.routes.js'
import { trendingRoutes } from './routes/trending.routes.js'
import { movieRoutes } from './routes/movie.routes.js'
import { personRoutes } from './routes/person.routes.js'
import { discoverRoutes } from './routes/discover.routes.js'
import { genresRoutes } from './routes/genres.routes.js'
import { providersRoutes } from './routes/providers.routes.js'
import { authRoutes } from './routes/auth.routes.js'
import { wishlistRoutes } from './routes/wishlist.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later', code: 429 },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later', code: 429 },
})

app.use('/api', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

app.use('/api/search', searchRoutes)
app.use('/api/trending', trendingRoutes)
app.use('/api/movie', movieRoutes)
app.use('/api/person', personRoutes)
app.use('/api/discover', discoverRoutes)
app.use('/api/genres', genresRoutes)
app.use('/api/providers', providersRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/wishlist', wishlistRoutes)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
})
