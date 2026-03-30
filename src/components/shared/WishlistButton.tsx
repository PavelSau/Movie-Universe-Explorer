import { useState, useCallback } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/stores/useAuthStore'
import { useIsInWishlist, useToggleWishlist } from '@/hooks/useWishlist'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  entityType: 'movie' | 'person'
  entityId: number
  title: string
  posterPath: string | null
  onAuthRequired?: () => void
}

export function WishlistButton({ entityType, entityId, title, posterPath, onAuthRequired }: WishlistButtonProps) {
  const { isAuthenticated } = useAuth()
  const { data: isInWishlist, isLoading: checking } = useIsInWishlist(entityType, entityId)
  const { add, remove, isLoading: toggling } = useToggleWishlist()
  const [optimistic, setOptimistic] = useState<boolean | null>(null)

  const inList = optimistic ?? isInWishlist ?? false
  const busy = checking || toggling

  const handleToggle = useCallback(async () => {
    if (!isAuthenticated) {
      onAuthRequired?.()
      return
    }

    try {
      if (inList) {
        setOptimistic(false)
        await remove({ entityType, entityId })
      } else {
        setOptimistic(true)
        await add({ entityType, entityId, title, posterPath })
      }
    } catch {
      setOptimistic(null)
    }
  }, [isAuthenticated, inList, entityType, entityId, title, posterPath, add, remove, onAuthRequired])

  return (
    <Button
      variant={inList ? 'default' : 'outline'}
      size="lg"
      onClick={handleToggle}
      disabled={busy}
      className={cn(
        'gap-2 transition-all duration-200',
        inList && 'bg-primary shadow-lg shadow-primary/25',
      )}
    >
      {busy ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Heart size={18} className={cn(inList && 'fill-primary-foreground')} />
      )}
      {inList
        ? entityType === 'movie' ? 'In Watchlist' : 'In Favorites'
        : entityType === 'movie' ? 'Add to Watchlist' : 'Add to Favorites'
      }
    </Button>
  )
}
