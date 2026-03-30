export interface PersonDetail {
  id: number
  name: string
  biography: string | null
  birthday: string | null
  deathday: string | null
  placeOfBirth: string | null
  profilePath: string | null
  knownForDepartment: string | null
  popularity: number
}

export interface PersonCreditItem {
  id: number
  title: string
  mediaType: 'movie' | 'tv'
  character?: string | null
  job?: string | null
  department?: string | null
  posterPath: string | null
  releaseDate: string | null
  voteAverage: number | null
  popularity: number
  genreIds: number[]
}

export interface PersonCredits {
  cast: PersonCreditItem[]
  crew: PersonCreditItem[]
}
