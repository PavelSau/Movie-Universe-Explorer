import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { MovieDetail, MovieCredits } from '@/types/movie.types'

export function useMovieDetails(movieId: number) {
  return useQuery({
    queryKey: ['movie', movieId],
    queryFn: async (): Promise<MovieDetail> => {
      const { data } = await api.get(`/movie/${movieId}`)
      return data
    },
    enabled: movieId > 0,
    staleTime: 1000 * 60 * 60,
  })
}

export function useMovieCredits(movieId: number) {
  return useQuery({
    queryKey: ['movie', movieId, 'credits'],
    queryFn: async (): Promise<MovieCredits> => {
      const { data } = await api.get(`/movie/${movieId}/credits`)
      return data
    },
    enabled: movieId > 0,
    staleTime: 1000 * 60 * 60,
  })
}
