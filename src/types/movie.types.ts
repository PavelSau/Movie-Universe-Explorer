export interface SearchResult {
  id: number
  mediaType: 'movie' | 'person'
  title: string
  posterPath: string | null
  releaseDate: string | null
  overview: string | null
  voteAverage: number | null
  knownForDepartment: string | null
}

export interface SearchResponse {
  results: SearchResult[]
  page: number
  totalPages: number
  totalResults: number
}

export interface TrendingMovie {
  id: number
  title: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string | null
  overview: string | null
  voteAverage: number | null
  genreIds: number[]
  popularity: number
}

export interface TrendingResponse {
  results: TrendingMovie[]
  timeWindow: 'day' | 'week'
}
