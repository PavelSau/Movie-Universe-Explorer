import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Film, Users, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Poster } from '@/components/shared/Poster'
import { useWishlist, useToggleWishlist, type WishlistItem } from '@/hooks/useWishlist'
import { useAuth } from '@/stores/useAuthStore'

type FilterType = 'all' | 'movie' | 'person'

export function WishlistPage() {
  const { isAuthenticated, user } = useAuth()
  const [filter, setFilter] = useState<FilterType>('all')
  const queryType = filter === 'all' ? undefined : filter
  const { data: items, isLoading } = useWishlist(queryType)
  const { remove } = useToggleWishlist()

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <Heart size={48} className="mx-auto text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-bold text-foreground">Sign in to view your lists</h2>
        <p className="mt-2 text-muted-foreground">Your watchlist and favorites are saved to your account</p>
        <Link to="/">
          <Button variant="outline" className="mt-6 gap-2">
            <ArrowLeft size={16} /> Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  const movieCount = items?.filter((i) => i.entityType === 'movie').length || 0
  const personCount = items?.filter((i) => i.entityType === 'person').length || 0

  const handleRemove = async (item: WishlistItem) => {
    await remove({ entityType: item.entityType, entityId: item.entityId })
  }

  return (
    <>
      {/* Hero */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-hero-from via-transparent to-hero-to" />
        <div className="pointer-events-none absolute top-0 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-10 sm:px-6 lg:px-8">
          <Link to="/">
            <Button variant="secondary" size="sm" className="mb-6 backdrop-blur-md">
              <ArrowLeft size={16} /> Back to Home
            </Button>
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Heart size={14} />
                {user?.displayName}'s Collection
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                My
                <span className="ml-2 bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  Lists
                </span>
              </h1>
              <p className="mt-2 text-muted-foreground">
                {movieCount} movies · {personCount} favorites
              </p>
            </div>

            <ToggleGroup
              value={[filter]}
              onValueChange={(v) => { if (v.length > 0) setFilter(v[0] as FilterType) }}
              className="rounded-full border border-border/50 bg-muted/50 p-1"
            >
              <ToggleGroupItem value="all" className="rounded-full px-4 py-1.5 text-sm data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-md data-[pressed]:shadow-primary/25">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="movie" className="rounded-full px-4 py-1.5 text-sm data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-md data-[pressed]:shadow-primary/25">
                <Film size={14} className="mr-1" /> Movies
              </ToggleGroupItem>
              <ToggleGroupItem value="person" className="rounded-full px-4 py-1.5 text-sm data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-md data-[pressed]:shadow-primary/25">
                <Users size={14} className="mr-1" /> People
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Separator className="mb-8 bg-border/50" />

        {isLoading && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {items && items.length === 0 && (
          <div className="py-20 text-center">
            <Heart size={48} className="mx-auto text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {filter === 'all' ? 'Your lists are empty' : filter === 'movie' ? 'No movies in watchlist' : 'No favorite people'}
            </h3>
            <p className="mt-2 text-muted-foreground">
              Browse movies and actors to add them to your lists
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-4 gap-2">
                Explore Movies
              </Button>
            </Link>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <WishlistCard key={item.id} item={item} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function WishlistCard({ item, onRemove }: { item: WishlistItem; onRemove: (item: WishlistItem) => void }) {
  const detailPath = item.entityType === 'movie' ? `/movie/${item.entityId}` : `/person/${item.entityId}`
  const isMovie = item.entityType === 'movie'

  return (
    <div className="group relative">
      <Link to={detailPath} className="cursor-pointer">
        <Card className="relative p-0 border-border/50 bg-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30">
          <div className={`relative ${isMovie ? 'aspect-[2/3]' : 'aspect-square'} overflow-hidden rounded-t-xl`}>
            <Poster
              path={item.posterPath}
              alt={item.title}
              size="card"
              type={item.entityType}
              className="h-full w-full transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-overlay to-transparent" />
            <Badge className="absolute top-2 left-2 gap-1 bg-overlay text-overlay-foreground backdrop-blur-md border-0 hover:bg-overlay text-xs">
              {isMovie ? <><Film size={12} /> Movie</> : <><Users size={12} /> Person</>}
            </Badge>
          </div>
          <CardContent className="p-3">
            <h3 className="truncate font-semibold text-card-foreground">{item.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Added {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </Link>

      {/* Remove button — visible on hover */}
      <Button
        variant="destructive"
        size="icon-xs"
        className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 shadow-lg"
        onClick={(e) => { e.preventDefault(); onRemove(item) }}
      >
        <Trash2 size={12} />
      </Button>
    </div>
  )
}
