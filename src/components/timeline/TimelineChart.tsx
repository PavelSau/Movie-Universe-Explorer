import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import { useNavigate } from 'react-router-dom'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { Button } from '@/components/ui/button'
import { TimelineTooltip } from '@/components/timeline/TimelineTooltip'
import { TimelineLegend, CHART_COLORS } from '@/components/timeline/TimelineLegend'
import type { TimelineItem, Genre } from '@/types/timeline.types'
import { cn } from '@/lib/utils'

interface TimelineChartProps {
  items: TimelineItem[]
  genres: Genre[]
}

const MARGIN = { top: 20, right: 30, bottom: 50, left: 30 }

export function TimelineChart({ items, genres }: TimelineChartProps) {
  const [containerRef, size] = useResizeObserver()
  const xAxisRef = useRef<SVGGElement>(null)
  const brushRef = useRef<SVGGElement>(null)
  const navigate = useNavigate()

  const [hoveredItem, setHoveredItem] = useState<TimelineItem | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [brushExtent, setBrushExtent] = useState<[Date, Date] | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipHoveredRef = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const genreMap = useMemo(
    () => new Map(genres.map((g) => [g.id, g])),
    [genres],
  )

  const genreColorMap = useMemo(() => {
    const uniqueGenres = [...new Set(items.map((i) => i.primaryGenreId).filter(Boolean))] as number[]
    const map = new Map<number, string>()
    uniqueGenres.forEach((gId, idx) => {
      map.set(gId, CHART_COLORS[idx % CHART_COLORS.length])
    })
    return map
  }, [items])

  const getColor = useCallback(
    (genreId: number | null) => {
      if (genreId === null) return 'var(--muted-foreground)'
      return genreColorMap.get(genreId) ?? 'var(--muted-foreground)'
    },
    [genreColorMap],
  )

  const innerWidth = size.width - MARGIN.left - MARGIN.right
  const innerHeight = size.height - MARGIN.top - MARGIN.bottom

  const fullDomain = useMemo((): [Date, Date] => {
    if (items.length === 0) return [new Date(2000, 0, 1), new Date()]
    const dates = items.map((i) => i.releaseDate)
    const min = d3.min(dates) as Date
    const max = d3.max(dates) as Date
    const padding = (max.getTime() - min.getTime()) * 0.05 || 1000 * 60 * 60 * 24 * 365
    return [new Date(min.getTime() - padding), new Date(max.getTime() + padding)]
  }, [items])

  const activeDomain = brushExtent ?? fullDomain

  const xScale = useMemo(
    () =>
      d3
        .scaleTime()
        .domain(activeDomain)
        .range([0, innerWidth]),
    [activeDomain, innerWidth],
  )

  const radiusScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, 10])
        .range([6, 18])
        .clamp(true),
    [],
  )

  // Render D3 axis
  useEffect(() => {
    if (!xAxisRef.current || innerWidth <= 0) return
    const axis = d3.axisBottom(xScale).ticks(Math.max(2, Math.floor(innerWidth / 120)))
    d3.select(xAxisRef.current).call(axis)
    d3.select(xAxisRef.current)
      .selectAll('text')
      .style('fill', 'var(--muted-foreground)')
      .style('font-size', '11px')
    d3.select(xAxisRef.current)
      .selectAll('line, path')
      .style('stroke', 'var(--border)')
  }, [xScale, innerWidth])

  // D3 brush for zooming
  useEffect(() => {
    if (!brushRef.current || innerWidth <= 0 || innerHeight <= 0) return

    const brush = d3
      .brushX<unknown>()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on('end', (event: d3.D3BrushEvent<unknown>) => {
        if (!event.selection) {
          setBrushExtent(null)
          return
        }
        const [x0, x1] = event.selection as [number, number]
        const fullScale = d3.scaleTime().domain(fullDomain).range([0, innerWidth])
        setBrushExtent([fullScale.invert(x0), fullScale.invert(x1)])
        d3.select(brushRef.current!).call(brush.move, null)
      })

    const g = d3.select(brushRef.current)
    g.call(brush)

    g.selectAll('.selection')
      .style('fill', 'var(--primary)')
      .style('fill-opacity', '0.15')
      .style('stroke', 'var(--primary)')

    return () => {
      g.on('.brush', null)
    }
  }, [innerWidth, innerHeight, fullDomain])

  // Tooltip delayed hide
  const scheduleHide = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      if (!tooltipHoveredRef.current) {
        setHoveredItem(null)
      }
    }, 300)
  }, [])

  const handleCircleEnter = useCallback(
    (item: TimelineItem, e: React.MouseEvent<SVGCircleElement>) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
      setHoveredItem(item)
      const rect = (e.target as SVGCircleElement).getBoundingClientRect()
      setTooltipPos({ x: rect.x + rect.width / 2, y: rect.y })
    },
    [],
  )

  const handleCircleLeave = useCallback(() => {
    scheduleHide()
  }, [scheduleHide])

  const handleTooltipEnter = useCallback(() => {
    tooltipHoveredRef.current = true
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const handleTooltipLeave = useCallback(() => {
    tooltipHoveredRef.current = false
    setHoveredItem(null)
  }, [])

  const handleCircleClick = useCallback(
    (item: TimelineItem) => {
      if (item.mediaType === 'movie') {
        navigate(`/movie/${item.id}`)
      }
    },
    [navigate],
  )

  const handleResetZoom = useCallback(() => {
    setBrushExtent(null)
  }, [])

  if (items.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex h-[50vh] items-center justify-center rounded-xl border border-border/50 bg-card/50"
      >
        <p className="text-muted-foreground">No timeline data available</p>
      </div>
    )
  }

  // Stagger overlapping items vertically
  const yCenter = innerHeight / 2
  const positionedItems = items.map((item, idx) => {
    const cx = xScale(item.releaseDate)
    const r = radiusScale(item.voteAverage)
    const row = idx % 3
    const yOffset = (row - 1) * 40
    return { ...item, cx, cy: yCenter + yOffset, r }
  })

  return (
    <div className="space-y-1">
      <div
        ref={containerRef}
        className="relative h-[50vh] rounded-xl border border-border/50 bg-card/50"
      >
        {size.width > 0 && size.height > 0 && (
          <svg
            ref={svgRef}
            width={size.width}
            height={size.height}
            className="cursor-crosshair"
          >
            <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
              {/* Grid lines */}
              {xScale.ticks(Math.max(2, Math.floor(innerWidth / 120))).map((tick) => (
                <line
                  key={tick.getTime()}
                  x1={xScale(tick)}
                  x2={xScale(tick)}
                  y1={0}
                  y2={innerHeight}
                  style={{ stroke: 'var(--border)' }}
                  strokeOpacity={0.3}
                  strokeDasharray="4 4"
                />
              ))}

              {/* Brush layer — behind circles, pointer-events only when not hovering a circle */}
              <g ref={brushRef} style={{ pointerEvents: hoveredItem ? 'none' : 'all' }} />

              {/* Movie circles — on top for hover/click */}
              {positionedItems.map((item) => (
                <circle
                  key={`${item.id}-${item.character}`}
                  cx={item.cx}
                  cy={item.cy}
                  r={item.r}
                  style={{
                    fill: getColor(item.primaryGenreId),
                    stroke: getColor(item.primaryGenreId),
                  }}
                  fillOpacity={0.7}
                  strokeWidth={2}
                  strokeOpacity={0.9}
                  className={cn(
                    'cursor-pointer transition-opacity duration-200',
                    hoveredItem && hoveredItem.id !== item.id && 'opacity-40',
                  )}
                  onMouseEnter={(e) => handleCircleEnter(item, e)}
                  onMouseLeave={handleCircleLeave}
                  onClick={() => handleCircleClick(item)}
                  aria-label={`${item.title} (${item.year}) - Rating: ${item.voteAverage.toFixed(1)}`}
                />
              ))}

              {/* X axis */}
              <g
                ref={xAxisRef}
                transform={`translate(0, ${innerHeight})`}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          </svg>
        )}

        {/* Reset zoom button */}
        {brushExtent && (
          <div className="absolute top-3 right-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              className="shadow-lg backdrop-blur-md bg-card/90"
            >
              Reset Zoom
            </Button>
          </div>
        )}

        {hoveredItem && (
          <TimelineTooltip
            item={hoveredItem}
            x={tooltipPos.x}
            y={tooltipPos.y}
            genreMap={genreMap}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
          />
        )}
      </div>

      <TimelineLegend genreColorMap={genreColorMap} genreMap={genreMap} />
    </div>
  )
}
