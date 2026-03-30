import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useTrending } from '@/hooks/useTrending'
import { TrendingCard } from '@/components/trending/TrendingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function TrendingDashboard() {
  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('day')
  const { data, isLoading, error } = useTrending(timeWindow)

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp size={24} className="text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Trending</h2>
        </div>
        <ToggleGroup
          value={[timeWindow]}
          onValueChange={(value) => {
            if (value.length > 0) setTimeWindow(value[0] as 'day' | 'week')
          }}
          className="rounded-full bg-muted p-1"
        >
          <ToggleGroupItem
            value="day"
            className="rounded-full px-4 py-1.5 text-sm data-[pressed]:bg-background data-[pressed]:shadow-sm"
          >
            Today
          </ToggleGroupItem>
          <ToggleGroupItem
            value="week"
            className="rounded-full px-4 py-1.5 text-sm data-[pressed]:bg-background data-[pressed]:shadow-sm"
          >
            This Week
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Failed to load trending movies</p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.results.map((movie) => (
            <TrendingCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  )
}
