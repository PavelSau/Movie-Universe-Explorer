import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { SearchResponse } from '@/types/movie.types'

export function useMovieSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async (): Promise<SearchResponse> => {
      const { data } = await api.get('/search', { params: { query } })
      return data
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 15,
  })
}
