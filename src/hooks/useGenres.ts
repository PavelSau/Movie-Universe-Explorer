import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { Genre } from '@/types/timeline.types'

interface GenresResponse {
  genres: Genre[]
}

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async (): Promise<Genre[]> => {
      const { data } = await api.get<GenresResponse>('/genres')
      return data.genres
    },
    staleTime: 1000 * 60 * 60 * 24,
  })
}
