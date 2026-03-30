import { useMemo, useCallback, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveScatterPlot } from '@nivo/scatterplot'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { POSTER_SIZES } from '@/utils/constants'
import { TimelineLegend, CHART_COLORS } from '@/components/timeline/TimelineLegend'
import { ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react'
import type { TimelineItem, Genre } from '@/types/timeline.types'

interface TimelineChartProps {
  items: TimelineItem[]
  genres: Genre[]
}

export function TimelineChart({ items, genres }: TimelineChartProps) {
  const genreMap = useMemo(
    () => new Map(genres.map((g) => [g.id, g])),
    [genres],
  )

  // Compute full year range from data
  const fullRange = useMemo((): [number, number] => {
    if (items.length === 0) return [2000, 2025]
    const years = items.map((i) => i.year)
    return [Math.min(...years) - 1, Math.max(...years) + 1]
  }, [items])

  const [yearRange, setYearRange] = useState<[number, number]>(fullRange)

  const filteredItems = useMemo(
    () => items.filter((i) => i.year >= yearRange[0] && i.year <= yearRange[1]),
    [items, yearRange],
  )

  // Zoom controls
  const zoomIn = useCallback(() => {
    setYearRange(([from, to]) => {
      const mid = Math.round((from + to) / 2)
      const halfSpan = Math.max(2, Math.round((to - from) / 4))
      return [mid - halfSpan, mid + halfSpan]
    })
  }, [])

  const zoomOut = useCallback(() => {
    setYearRange(([from, to]) => {
      const mid = Math.round((from + to) / 2)
      const halfSpan = Math.round((to - from) / 2) + 5
      return [Math.max(fullRange[0], mid - halfSpan), Math.min(fullRange[1], mid + halfSpan)]
    })
  }, [fullRange])

  const resetZoom = useCallback(() => {
    setYearRange(fullRange)
  }, [fullRange])

  // Shift left/right
  const shiftLeft = useCallback(() => {
    setYearRange(([from, to]) => {
      const span = to - from
      const shift = Math.max(1, Math.round(span / 4))
      const newFrom = Math.max(fullRange[0], from - shift)
      return [newFrom, newFrom + span]
    })
  }, [fullRange])

  const shiftRight = useCallback(() => {
    setYearRange(([from, to]) => {
      const span = to - from
      const shift = Math.max(1, Math.round(span / 4))
      const newTo = Math.min(fullRange[1], to + shift)
      return [newTo - span, newTo]
    })
  }, [fullRange])

  const isZoomed = yearRange[0] !== fullRange[0] || yearRange[1] !== fullRange[1]

  // Sticky tooltip state — same pattern as graph
  const [stickyItem, setStickyItem] = useState<TimelineItem | null>(null)
  const [stickyPos, setStickyPos] = useState({ x: 0, y: 0 })
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipHoveredRef = useRef(false)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const showStickyTooltip = useCallback((item: TimelineItem, screenX: number, screenY: number) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setStickyItem(item)
    const rect = chartContainerRef.current?.getBoundingClientRect()
    setStickyPos({
      x: screenX - (rect?.left || 0),
      y: screenY - (rect?.top || 0),
    })
  }, [])

  const scheduleHideTooltip = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      if (!tooltipHoveredRef.current) setStickyItem(null)
    }, 400)
  }, [])

  const handleTooltipEnter = useCallback(() => {
    tooltipHoveredRef.current = true
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const handleTooltipLeave = useCallback(() => {
    tooltipHoveredRef.current = false
    setStickyItem(null)
  }, [])

  const genreColorMap = useMemo(() => {
    const uniqueGenres = [...new Set(items.map((i) => i.primaryGenreId).filter(Boolean))] as number[]
    const map = new Map<number, string>()
    uniqueGenres.forEach((gId, idx) => {
      map.set(gId, CHART_COLORS[idx % CHART_COLORS.length])
    })
    return map
  }, [items])

  // Group items by genre for nivo series
  const nivoData = useMemo(() => {
    const groups = new Map<string, Array<{ x: string; y: number; item: TimelineItem }>>()

    for (const item of filteredItems) {
      const genreId = item.primaryGenreId
      const genreName = genreId ? (genreMap.get(genreId)?.name ?? 'Other') : 'Other'

      if (!groups.has(genreName)) groups.set(genreName, [])
      groups.get(genreName)!.push({
        x: item.releaseDate.toISOString().slice(0, 10),
        y: item.voteAverage,
        item,
      })
    }

    return Array.from(groups.entries()).map(([genreName, data]) => ({
      id: genreName,
      data,
    }))
  }, [filteredItems, genreMap])

  const seriesColors = useMemo(() => {
    return nivoData.map((series) => {
      const firstItem = series.data[0]?.item
      if (!firstItem?.primaryGenreId) return 'var(--muted-foreground)'
      return genreColorMap.get(firstItem.primaryGenreId) ?? 'var(--muted-foreground)'
    })
  }, [nivoData, genreColorMap])


  if (items.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center rounded-xl border border-border/50 bg-card/50">
        <p className="text-muted-foreground">No timeline data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Zoom controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-card/90 p-1 shadow-sm backdrop-blur-md">
            <Button variant="ghost" size="icon-sm" onClick={shiftLeft} aria-label="Pan left">
              <span className="text-xs font-bold">←</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={zoomIn} aria-label="Zoom in">
              <ZoomIn size={14} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={zoomOut} aria-label="Zoom out">
              <ZoomOut size={14} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={shiftRight} aria-label="Pan right">
              <span className="text-xs font-bold">→</span>
            </Button>
            {isZoomed && (
              <Button variant="ghost" size="icon-sm" onClick={resetZoom} aria-label="Reset zoom">
                <RotateCcw size={14} />
              </Button>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {yearRange[0]} — {yearRange[1]}
            {isZoomed && ` (${filteredItems.length} of ${items.length} titles)`}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="relative h-[50vh] min-h-80 rounded-xl border border-border/50 bg-card/50">
        <ResponsiveScatterPlot
          data={nivoData}
          margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
          xScale={{
            type: 'time',
            format: '%Y-%m-%d',
            precision: 'day',
            min: `${yearRange[0]}-01-01`,
            max: `${yearRange[1]}-12-31`,
          }}
          xFormat="time:%Y"
          yScale={{ type: 'linear', min: 0, max: 10 }}
          yFormat={(v) => `${Number(v).toFixed(1)} ★`}
          colors={seriesColors}
          nodeSize={(d) => {
            const rating = (d as unknown as { data: { y: number } }).data.y
            return Math.max(8, rating * 2.5)
          }}
          blendMode="normal"
          enableGridX={true}
          enableGridY={true}
          axisBottom={{
            format: '%Y',
            tickSize: 0,
            tickPadding: 10,
            legend: 'Year',
            legendPosition: 'middle',
            legendOffset: 45,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 10,
            legend: 'Rating',
            legendPosition: 'middle',
            legendOffset: -45,
          }}
          useMesh={true}
          onMouseMove={(node, event) => {
            const raw = node as unknown as Record<string, unknown>
            // nivo scatterplot node has .data which is our { x, y, item } object
            const dataObj = raw.data as Record<string, unknown> | undefined
            const item = dataObj?.item as TimelineItem | undefined
            if (item && event) {
              showStickyTooltip(item, (event as unknown as MouseEvent).clientX, (event as unknown as MouseEvent).clientY)
            }
          }}
          onMouseLeave={scheduleHideTooltip}
          tooltip={() => null}
          theme={{
            text: { fill: 'var(--foreground)', fontFamily: 'Geist Variable, sans-serif' },
            grid: { line: { stroke: 'var(--border)', strokeOpacity: 0.3 } },
            axis: {
              ticks: { text: { fill: 'var(--muted-foreground)', fontSize: 11 } },
              legend: { text: { fill: 'var(--muted-foreground)', fontSize: 13, fontWeight: 600 } },
            },
          }}
          animate={false}
        />

        {/* Sticky tooltip */}
        {stickyItem && (
          <div
            className="absolute z-50 w-64 rounded-xl border border-border/50 bg-popover/95 p-3 shadow-xl backdrop-blur-xl"
            style={{ left: stickyPos.x + 15, top: stickyPos.y - 30 }}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
          >
            <div className="flex gap-3">
              {stickyItem.posterPath ? (
                <img
                  src={`${POSTER_SIZES.thumbnail}${stickyItem.posterPath}`}
                  alt={stickyItem.title}
                  className="h-20 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs">
                  No img
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-popover-foreground">{stickyItem.title}</p>
                <p className="text-xs text-muted-foreground">{stickyItem.year}</p>
                {stickyItem.character && (
                  <p className="mt-0.5 text-xs text-primary">as {stickyItem.character}</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {stickyItem.voteAverage > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      ★ {stickyItem.voteAverage.toFixed(1)}
                    </Badge>
                  )}
                  {(() => {
                    const gn = stickyItem.primaryGenreId ? genreMap.get(stickyItem.primaryGenreId)?.name : null
                    return gn ? <Badge variant="outline" className="text-[10px]">{gn}</Badge> : null
                  })()}
                </div>
                <div className="mt-2">
                  <Link to={stickyItem.mediaType === 'movie' ? `/movie/${stickyItem.id}` : '#'}>
                    <Button variant="outline" size="xs" className="gap-1">
                      <ExternalLink size={12} /> View details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <TimelineLegend genreColorMap={genreColorMap} genreMap={genreMap} />
    </div>
  )
}
