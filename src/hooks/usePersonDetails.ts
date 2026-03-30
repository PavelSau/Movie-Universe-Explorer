import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { PersonDetail, PersonCredits } from '@/types/person.types'

export function usePersonDetails(personId: number) {
  return useQuery({
    queryKey: ['person', personId],
    queryFn: async (): Promise<PersonDetail> => {
      const { data } = await api.get(`/person/${personId}`)
      return data
    },
    enabled: personId > 0,
    staleTime: 1000 * 60 * 60,
  })
}

export function usePersonCredits(personId: number) {
  return useQuery({
    queryKey: ['person', personId, 'credits'],
    queryFn: async (): Promise<PersonCredits> => {
      const { data } = await api.get(`/person/${personId}/credits`)
      return data
    },
    enabled: personId > 0,
    staleTime: 1000 * 60 * 60,
  })
}
