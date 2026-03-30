import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

export interface SimilarMovie {
  id: number
  title: string
  posterPath: string | null
  voteAverage: number
  releaseDate: string | null
}

interface SimilarMoviesResponse {
  results: SimilarMovie[]
}

export function useSimilarMovies(movieId: number) {
  return useQuery({
    queryKey: ['movie', movieId, 'similar'],
    queryFn: async (): Promise<SimilarMovie[]> => {
      const { data } = await api.get<SimilarMoviesResponse>(`/movie/${movieId}/similar`)
      return data.results
    },
    enabled: movieId > 0,
    staleTime: 1000 * 60 * 60,
  })
}

export function useRecommendedMovies(movieId: number) {
  return useQuery({
    queryKey: ['movie', movieId, 'recommendations'],
    queryFn: async (): Promise<SimilarMovie[]> => {
      const { data } = await api.get<SimilarMoviesResponse>(`/movie/${movieId}/recommendations`)
      return data.results
    },
    enabled: movieId > 0,
    staleTime: 1000 * 60 * 60,
  })
}
