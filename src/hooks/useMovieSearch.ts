import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { SEARCH_MAX_LENGTH } from '@/utils/constants'
import type { SearchResponse } from '@/types/movie.types'

function sanitizeSearchQuery(raw: string): string {
  return raw.trim().slice(0, SEARCH_MAX_LENGTH)
}

export function useMovieSearch(query: string) {
  const sanitized = sanitizeSearchQuery(query)

  return useQuery({
    queryKey: ['search', sanitized],
    queryFn: async (): Promise<SearchResponse> => {
      const { data } = await api.get('/search', { params: { query: sanitized } })
      return data
    },
    enabled: sanitized.length >= 2,
    staleTime: 1000 * 60 * 15,
  })
}
