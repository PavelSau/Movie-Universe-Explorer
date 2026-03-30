import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HeatmapCanvas } from '@/components/heatmap/HeatmapCanvas'
import { HeatmapControls } from '@/components/heatmap/HeatmapControls'
import { useHeatmapData } from '@/hooks/useHeatmapData'
import type { HeatmapMetric } from '@/types/heatmap.types'

export function HeatmapPage() {
  const { data, isLoading, error } = useHeatmapData()
  const [metric, setMetric] = useState<HeatmapMetric>('avgRating')

  return (
    <>
      {/* Hero section */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-hero-from via-transparent to-hero-to" />
        <div className="pointer-events-none absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-10 sm:px-6 lg:px-8">
          <Link to="/">
            <Button variant="secondary" size="sm" className="mb-6 backdrop-blur-md">
              <ArrowLeft size={16} /> Back to Home
            </Button>
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Grid3X3 size={14} />
                Data Visualization
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Genre
                <span className="ml-2 bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  Heatmap
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Explore how movie genres perform across decades. Compare average ratings or total movie counts to discover trends in cinema history.
              </p>
            </div>

            <HeatmapControls metric={metric} onMetricChange={setMetric} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {isLoading && <HeatmapSkeleton />}

        {error && (
          <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-destructive text-lg font-medium">Failed to load heatmap data</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please check your connection and try again.
            </p>
          </div>
        )}

        {data && (
          <div className="mt-8 h-[65vh] min-h-96 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
            <HeatmapCanvas data={data} metric={metric} />
          </div>
        )}
      </div>
    </>
  )
}

function HeatmapSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-[65vh] min-h-96 w-full rounded-xl" />
    </div>
  )
}
