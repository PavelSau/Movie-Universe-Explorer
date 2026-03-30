export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'
export const POSTER_SIZES = {
  thumbnail: `${TMDB_IMAGE_BASE}/w185`,
  card: `${TMDB_IMAGE_BASE}/w500`,
  original: `${TMDB_IMAGE_BASE}/original`,
} as const

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const SEARCH_DEBOUNCE_MS = 300
