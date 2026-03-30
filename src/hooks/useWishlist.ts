import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuth } from '@/stores/useAuthStore'

export interface WishlistItem {
  id: number
  entityType: 'movie' | 'person'
  entityId: number
  title: string
  posterPath: string | null
  createdAt: string
}

interface WishlistResponse {
  items: WishlistItem[]
}

export function useWishlist(type?: 'movie' | 'person') {
  const { isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: ['wishlist', user?.id, type || 'all'],
    queryFn: async (): Promise<WishlistItem[]> => {
      const params = type ? { type } : {}
      const { data } = await api.get<WishlistResponse>('/wishlist', { params })
      return data.items
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  })
}

export function useIsInWishlist(entityType: 'movie' | 'person', entityId: number) {
  const { isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: ['wishlist', 'check', user?.id, entityType, entityId],
    queryFn: async (): Promise<boolean> => {
      const { data } = await api.get('/wishlist/check', {
        params: { entityType, entityId },
      })
      return data.inWishlist
    },
    enabled: isAuthenticated && entityId > 0,
    staleTime: 1000 * 60,
  })
}

export function useToggleWishlist() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: async (item: { entityType: 'movie' | 'person'; entityId: number; title: string; posterPath: string | null }) => {
      await api.post('/wishlist', item)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (item: { entityType: 'movie' | 'person'; entityId: number }) => {
      await api.delete('/wishlist', { data: item })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  return { add: addMutation.mutateAsync, remove: removeMutation.mutateAsync, isLoading: addMutation.isPending || removeMutation.isPending }
}
