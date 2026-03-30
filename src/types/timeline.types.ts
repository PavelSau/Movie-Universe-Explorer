export interface TimelineItem {
  id: number
  title: string
  releaseDate: Date
  year: number
  voteAverage: number
  character: string | null
  posterPath: string | null
  mediaType: 'movie' | 'tv'
  primaryGenreId: number | null
  genreIds: number[]
}

export interface Genre {
  id: number
  name: string
}
