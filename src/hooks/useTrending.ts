import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { TrendingResponse } from '@/types/movie.types'

export function useTrending(timeWindow: 'day' | 'week' = 'day') {
  return useQuery({
    queryKey: ['trending', timeWindow],
    queryFn: async (): Promise<TrendingResponse> => {
      const { data } = await api.get('/trending', { params: { window: timeWindow } })
      return data
    },
    staleTime: 1000 * 60 * 15,
  })
}
