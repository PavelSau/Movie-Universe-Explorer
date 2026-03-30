import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { TrendingPeopleResponse } from '@/types/movie.types'

export function useTrendingPeople(timeWindow: 'day' | 'week' = 'day') {
  return useQuery({
    queryKey: ['trending', 'people', timeWindow],
    queryFn: async (): Promise<TrendingPeopleResponse> => {
      const { data } = await api.get('/trending/people', { params: { window: timeWindow } })
      return data
    },
    staleTime: 1000 * 60 * 15,
  })
}
