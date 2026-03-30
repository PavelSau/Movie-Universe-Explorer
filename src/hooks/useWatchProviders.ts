import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

interface Provider {
  id: number
  name: string
  logoPath: string | null
}

export interface WatchProviders {
  stream: Provider[]
  rent: Provider[]
  buy: Provider[]
  link: string | null
  availableCountries: string[]
}

export function useWatchProviders(movieId: number) {
  return useQuery({
    queryKey: ['providers', movieId],
    queryFn: async (): Promise<WatchProviders> => {
      const { data } = await api.get(`/providers/${movieId}`)
      return data
    },
    enabled: movieId > 0,
    staleTime: 1000 * 60 * 60,
  })
}
