import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const config = {
  port: Number(process.env.PORT) || 3001,
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  tmdbBaseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-fallback-secret',
}

if (!config.tmdbApiKey || config.tmdbApiKey === 'your_tmdb_api_key_here') {
  console.error('TMDB_API_KEY is not set in .env file')
  process.exit(1)
}
