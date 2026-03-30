import type { Genre } from '@/types/timeline.types'

export interface HeatmapCell {
  genreId: number
  genreName: string
  decade: number
  avgRating: number
  movieCount: number
}

export interface HeatmapData {
  cells: HeatmapCell[]
  genres: Genre[]
  decades: number[]
}

export type HeatmapMetric = 'avgRating' | 'movieCount'

export interface DiscoverResult {
  id: number
  title: string
  posterPath: string | null
  releaseDate: string | null
  voteAverage: number
  genreIds: number[]
  popularity: number
}

export interface DiscoverResponse {
  results: DiscoverResult[]
  totalPages: number
  totalResults: number
}
