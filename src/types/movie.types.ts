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

export interface TrendingPerson {
  id: number
  name: string
  profilePath: string | null
  knownForDepartment: string | null
  popularity: number
}

export interface TrendingPeopleResponse {
  results: TrendingPerson[]
  timeWindow: 'day' | 'week'
}

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  name: string
  logoPath: string | null
}

export interface MovieDetail {
  id: number
  title: string
  tagline: string | null
  overview: string | null
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string | null
  runtime: number | null
  voteAverage: number
  voteCount: number
  budget: number
  revenue: number
  status: string
  genres: Genre[]
  productionCompanies: ProductionCompany[]
}

export interface CastMember {
  id: number
  name: string
  character: string
  profilePath: string | null
  order: number
}

export interface CrewMember {
  id: number
  name: string
  job: string
  department: string
  profilePath: string | null
}

export interface MovieCredits {
  cast: CastMember[]
  crew: CrewMember[]
}
