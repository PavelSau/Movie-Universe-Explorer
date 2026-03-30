import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useTrending } from '@/hooks/useTrending'
import { TrendingCard } from '@/components/trending/TrendingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'

export function TrendingDashboard() {
  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('day')
  const { data, isLoading, error } = useTrending(timeWindow)

  return (
    <section className="mt-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Trending Now</h2>
            <p className="text-sm text-muted-foreground">What everyone is watching</p>
          </div>
        </div>
        <ToggleGroup
          value={[timeWindow]}
          onValueChange={(value) => {
            if (value.length > 0) setTimeWindow(value[0] as 'day' | 'week')
          }}
          className="rounded-full border border-border/50 bg-muted/50 p-1"
        >
          <ToggleGroupItem
            value="day"
            className="rounded-full px-4 py-1.5 text-sm data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-md data-[pressed]:shadow-primary/25"
          >
            Today
          </ToggleGroupItem>
          <ToggleGroupItem
            value="week"
            className="rounded-full px-4 py-1.5 text-sm data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-md data-[pressed]:shadow-primary/25"
          >
            This Week
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator className="mb-8 bg-border/50" />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">Failed to load trending movies</p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.results.map((movie, index) => (
            <TrendingCard key={movie.id} movie={movie} rank={index + 1} />
          ))}
        </div>
      )}
    </section>
  )
}
