import { useState, useCallback } from 'react'
import { CalendarRange } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { TimelineChart } from '@/components/timeline/TimelineChart'
import { usePersonCredits } from '@/hooks/usePersonDetails'
import { useGenres } from '@/hooks/useGenres'
import { useTimelineData } from '@/hooks/useTimelineData'

interface TimelineViewProps {
  personId: number
}

export function TimelineView({ personId }: TimelineViewProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { data: credits, isLoading: creditsLoading } = usePersonCredits(personId)
  const { data: genres, isLoading: genresLoading } = useGenres()
  const items = useTimelineData(credits)

  const isLoading = creditsLoading || genresLoading

  const handleToggle = useCallback(() => {
    setIsVisible((prev) => !prev)
  }, [])

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <CalendarRange size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Career Timeline
            </h2>
            <p className="text-sm text-muted-foreground">
              {isVisible
                ? `${items.length} titles · Brush to zoom · Click to explore · Hover for details`
                : 'Visualize career across time'}
            </p>
          </div>
        </div>
        <Button
          variant={isVisible ? 'default' : 'outline'}
          onClick={handleToggle}
          className="gap-2"
        >
          <CalendarRange size={16} />
          {isVisible ? 'Hide Timeline' : 'Show Timeline'}
        </Button>
      </div>

      <Separator className="mb-6 bg-border/50" />

      {isVisible && (
        <div>
          {isLoading ? (
            <div className="flex h-[50vh] items-center justify-center rounded-xl border border-border/50 bg-card/50">
              <div className="text-center space-y-4">
                <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                <p className="text-muted-foreground">Loading timeline data...</p>
              </div>
            </div>
          ) : (
            <TimelineChart items={items} genres={genres ?? []} />
          )}
        </div>
      )}
    </div>
  )
}
