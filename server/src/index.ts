import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { searchRoutes } from './routes/search.routes.js'
import { trendingRoutes } from './routes/trending.routes.js'
import { movieRoutes } from './routes/movie.routes.js'
import { personRoutes } from './routes/person.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/search', searchRoutes)
app.use('/api/trending', trendingRoutes)
app.use('/api/movie', movieRoutes)
app.use('/api/person', personRoutes)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
})
