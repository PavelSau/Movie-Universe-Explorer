import { useMemo, useState, useCallback } from 'react'
import { ResponsiveRadar } from '@nivo/radar'
import { Radar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useGenres } from '@/hooks/useGenres'
import type { PersonCredits } from '@/types/person.types'

interface GenreRadarProps {
  credits: PersonCredits | undefined
  isLoading: boolean
}

export function GenreRadar({ credits, isLoading }: GenreRadarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { data: genres } = useGenres()

  const radarData = useMemo(() => {
    if (!credits || !genres) return []

    // Count genre occurrences across all cast credits
    const genreCounts = new Map<number, number>()
    for (const credit of credits.cast) {
      for (const gId of credit.genreIds) {
        genreCounts.set(gId, (genreCounts.get(gId) || 0) + 1)
      }
    }

    const genreMap = new Map(genres.map((g) => [g.id, g.name]))

    // Sort by count, take top 10 for readability
    return Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genreId, count]) => ({
        genre: genreMap.get(genreId) || 'Unknown',
        count,
      }))
  }, [credits, genres])

  const handleToggle = useCallback(() => {
    setIsVisible((prev) => !prev)
  }, [])

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Radar size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Genre Profile</h2>
            <p className="text-sm text-muted-foreground">
              {isVisible ? `Top ${radarData.length} genres across career` : 'Career genre distribution'}
            </p>
          </div>
        </div>
        <Button
          variant={isVisible ? 'default' : 'outline'}
          onClick={handleToggle}
          className="gap-2"
        >
          <Radar size={16} />
          {isVisible ? 'Hide Radar' : 'Show Radar'}
        </Button>
      </div>

      <Separator className="mb-6 bg-border/50" />

      {isVisible && (
        <>
          {isLoading || !radarData.length ? (
            <div className="flex h-[50vh] items-center justify-center rounded-xl border border-border/50 bg-card/50">
              {isLoading ? (
                <div className="text-center space-y-4">
                  <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                  <p className="text-muted-foreground">Loading genre data...</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No genre data available</p>
              )}
            </div>
          ) : (
            <div className="h-[50vh] min-h-80 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
              <ResponsiveRadar
                data={radarData}
                keys={['count']}
                indexBy="genre"
                maxValue="auto"
                margin={{ top: 60, right: 80, bottom: 40, left: 80 }}
                curve="linearClosed"
                borderWidth={2}
                borderColor="var(--primary)"
                gridLevels={5}
                gridShape="circular"
                gridLabelOffset={20}
                enableDots={true}
                dotSize={10}
                dotColor="var(--background)"
                dotBorderWidth={2}
                dotBorderColor="var(--primary)"
                enableDotLabel={true}
                dotLabel="value"
                dotLabelYOffset={-12}
                fillOpacity={0.25}
                blendMode="normal"
                animate={false}
                colors={['var(--primary)']}
                theme={{
                  text: {
                    fill: 'var(--foreground)',
                    fontFamily: 'Geist Variable, sans-serif',
                    fontSize: 12,
                  },
                  grid: {
                    line: { stroke: 'var(--border)', strokeOpacity: 0.4 },
                  },
                  dots: {
                    text: {
                      fill: 'var(--muted-foreground)',
                      fontSize: 11,
                      fontWeight: 600,
                    },
                  },
                  tooltip: {
                    container: {
                      background: 'var(--popover)',
                      color: 'var(--popover-foreground)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                      fontSize: '13px',
                      fontFamily: 'Geist Variable, sans-serif',
                    },
                  },
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
