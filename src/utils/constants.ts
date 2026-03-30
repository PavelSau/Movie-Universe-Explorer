export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'
export const POSTER_SIZES = {
  thumbnail: `${TMDB_IMAGE_BASE}/w185`,
  card: `${TMDB_IMAGE_BASE}/w500`,
  original: `${TMDB_IMAGE_BASE}/original`,
} as const

export const BACKDROP_SIZES = {
  small: `${TMDB_IMAGE_BASE}/w780`,
  large: `${TMDB_IMAGE_BASE}/w1280`,
  original: `${TMDB_IMAGE_BASE}/original`,
} as const

export const PROFILE_SIZES = {
  thumbnail: `${TMDB_IMAGE_BASE}/w185`,
  card: `${TMDB_IMAGE_BASE}/w500`,
} as const

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const SEARCH_DEBOUNCE_MS = 300

export const MAX_GRAPH_CHILD_NODES = Number(import.meta.env.VITE_MAX_GRAPH_CHILD_NODES) || 50
