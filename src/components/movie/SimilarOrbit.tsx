import { useState, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Orbit, Star, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useSimilarMovies, useRecommendedMovies } from '@/hooks/useSimilarMovies'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { POSTER_SIZES } from '@/utils/constants'
import type { SimilarMovie } from '@/hooks/useSimilarMovies'

interface SimilarOrbitProps {
  movieId: number
  movieTitle: string
  moviePosterPath: string | null
}

interface HoveredNode {
  movie: SimilarMovie
  svgX: number
  svgY: number
}

const POSTER_THUMB = POSTER_SIZES.thumbnail
const CENTER_R = 50
const NODE_R = 32

export function SimilarOrbit({ movieId, movieTitle, moviePosterPath }: SimilarOrbitProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hovered, setHovered] = useState<HoveredNode | null>(null)
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipHoveredRef = useRef(false)

  const { data: similar, isLoading: loadingSimilar } = useSimilarMovies(isVisible ? movieId : 0)
  const { data: recommended, isLoading: loadingRecs } = useRecommendedMovies(isVisible ? movieId : 0)
  const [containerRef, containerSize] = useResizeObserver()
  const svgRef = useRef<SVGSVGElement>(null)

  const isLoading = loadingSimilar || loadingRecs
  const totalCount = (similar?.length || 0) + (recommended?.length || 0)

  // Dimensions — center everything, leave room for labels above top
  const dim = useMemo(() => {
    const w = containerSize.width || 600
    const outerR = Math.max(200, Math.min(w / 2 - NODE_R - 40, 280))
    const innerR = Math.max(110, outerR * 0.52)
    const h = outerR * 2 + NODE_R * 2 + 80
    const cx = w / 2
    const cy = h / 2 + 10
    return { w, h, cx, cy, innerR, outerR }
  }, [containerSize.width])

  // Position nodes around a circle
  const positionNodes = useCallback((items: SimilarMovie[], r: number) => {
    return items.map((movie, i) => {
      const angle = (2 * Math.PI * i) / items.length - Math.PI / 2
      return { movie, x: dim.cx + r * Math.cos(angle), y: dim.cy + r * Math.sin(angle) }
    })
  }, [dim.cx, dim.cy])

  const innerNodes = useMemo(() => positionNodes(similar || [], dim.innerR), [similar, dim.innerR, positionNodes])
  const outerNodes = useMemo(() => positionNodes(recommended || [], dim.outerR), [recommended, dim.outerR, positionNodes])

  // Convert SVG coords to container-relative pixel coords
  const svgToContainer = useCallback((svgX: number, svgY: number) => {
    const svg = svgRef.current
    const container = containerRef.current as HTMLDivElement | null
    if (!svg || !container) return { px: svgX, py: svgY }
    const svgRect = svg.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    // SVG viewBox maps dim.w/dim.h to svgRect.width/svgRect.height
    const scaleX = svgRect.width / dim.w
    const scaleY = svgRect.height / dim.h
    return {
      px: svgRect.left - containerRect.left + svgX * scaleX,
      py: svgRect.top - containerRect.top + svgY * scaleY,
    }
  }, [dim.w, dim.h, containerRef])

  // Tooltip delayed hide
  const showTooltip = useCallback((node: HoveredNode) => {
    if (hideRef.current) { clearTimeout(hideRef.current); hideRef.current = null }
    setHovered(node)
  }, [])

  const scheduleHide = useCallback(() => {
    hideRef.current = setTimeout(() => {
      if (!tooltipHoveredRef.current) setHovered(null)
    }, 400)
  }, [])

  const onTooltipEnter = useCallback(() => {
    tooltipHoveredRef.current = true
    if (hideRef.current) { clearTimeout(hideRef.current); hideRef.current = null }
  }, [])

  const onTooltipLeave = useCallback(() => {
    tooltipHoveredRef.current = false
    setHovered(null)
  }, [])

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Orbit size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Similar Movies Orbit</h2>
            <p className="text-sm text-muted-foreground">
              {isVisible ? `${totalCount} related movies · Hover for details` : 'Discover similar and recommended films'}
            </p>
          </div>
        </div>
        <Button variant={isVisible ? 'default' : 'outline'} onClick={() => setIsVisible((v) => !v)} className="gap-2">
          <Orbit size={16} />
          {isVisible ? 'Hide Orbit' : 'Show Orbit'}
        </Button>
      </div>

      <Separator className="mb-6 bg-border/50" />

      {isVisible && (
        <div ref={containerRef} className="relative rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
          {isLoading ? (
            <div className="flex h-[500px] items-center justify-center">
              <div className="text-center space-y-4">
                <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                <p className="text-muted-foreground">Loading orbit data...</p>
              </div>
            </div>
          ) : (
            <>
              <svg ref={svgRef} width="100%" height={dim.h} viewBox={`0 0 ${dim.w} ${dim.h}`} className="block">
                <defs>
                  <filter id="orbit-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="12" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Orbit rings */}
                <circle cx={dim.cx} cy={dim.cy} r={dim.outerR} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="8 5" strokeOpacity={0.25} />
                <circle cx={dim.cx} cy={dim.cy} r={dim.innerR} fill="none" stroke="var(--primary)" strokeWidth={1.5} strokeDasharray="8 5" strokeOpacity={0.25} />

                {/* Connection lines */}
                {innerNodes.map(({ movie, x, y }) => (
                  <line key={`ls-${movie.id}`} x1={dim.cx} y1={dim.cy} x2={x} y2={y} stroke="var(--primary)" strokeWidth={1} strokeOpacity={0.08} />
                ))}
                {outerNodes.map(({ movie, x, y }) => (
                  <line key={`lr-${movie.id}`} x1={dim.cx} y1={dim.cy} x2={x} y2={y} stroke="#f59e0b" strokeWidth={1} strokeOpacity={0.08} />
                ))}

                {/* Center glow + poster */}
                <circle cx={dim.cx} cy={dim.cy} r={CENTER_R + 8} fill="var(--primary)" opacity={0.12} filter="url(#orbit-glow)" />
                <circle cx={dim.cx} cy={dim.cy} r={CENTER_R + 2} fill="var(--primary)" opacity={0.3} />
                <clipPath id="orbit-center-clip"><circle cx={dim.cx} cy={dim.cy} r={CENTER_R} /></clipPath>
                {moviePosterPath ? (
                  <image href={`${POSTER_THUMB}${moviePosterPath}`} x={dim.cx - CENTER_R} y={dim.cy - CENTER_R} width={CENTER_R * 2} height={CENTER_R * 2} clipPath="url(#orbit-center-clip)" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <circle cx={dim.cx} cy={dim.cy} r={CENTER_R} fill="var(--muted)" />
                )}
                <text x={dim.cx} y={dim.cy + CENTER_R + 18} textAnchor="middle" fill="var(--foreground)" fontSize={12} fontWeight={600} opacity={0.8}>
                  {movieTitle.length > 24 ? movieTitle.slice(0, 22) + '…' : movieTitle}
                </text>

                {/* Inner orbit nodes (Similar) — solid primary ring */}
                {innerNodes.map(({ movie, x, y }) => (
                  <g key={`s-${movie.id}`} className="cursor-pointer" onMouseEnter={() => showTooltip({ movie, svgX: x, svgY: y })} onMouseLeave={scheduleHide}>
                    <circle cx={x} cy={y} r={NODE_R + 3} fill="none" stroke="var(--primary)" strokeWidth={3} />
                    <clipPath id={`clip-s-${movie.id}`}><circle cx={x} cy={y} r={NODE_R} /></clipPath>
                    {movie.posterPath ? (
                      <image href={`${POSTER_THUMB}${movie.posterPath}`} x={x - NODE_R} y={y - NODE_R} width={NODE_R * 2} height={NODE_R * 2} clipPath={`url(#clip-s-${movie.id})`} preserveAspectRatio="xMidYMid slice" />
                    ) : (
                      <circle cx={x} cy={y} r={NODE_R} fill="var(--muted)" />
                    )}
                  </g>
                ))}

                {/* Outer orbit nodes (Recommended) — orange/amber ring */}
                {outerNodes.map(({ movie, x, y }) => (
                  <g key={`r-${movie.id}`} className="cursor-pointer" onMouseEnter={() => showTooltip({ movie, svgX: x, svgY: y })} onMouseLeave={scheduleHide}>
                    <circle cx={x} cy={y} r={NODE_R + 3} fill="none" stroke="#f59e0b" strokeWidth={3} />
                    <clipPath id={`clip-r-${movie.id}`}><circle cx={x} cy={y} r={NODE_R} /></clipPath>
                    {movie.posterPath ? (
                      <image href={`${POSTER_THUMB}${movie.posterPath}`} x={x - NODE_R} y={y - NODE_R} width={NODE_R * 2} height={NODE_R * 2} clipPath={`url(#clip-r-${movie.id})`} preserveAspectRatio="xMidYMid slice" />
                    ) : (
                      <circle cx={x} cy={y} r={NODE_R} fill="var(--muted)" />
                    )}
                  </g>
                ))}
              </svg>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border-2" style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--primary)', opacity: 0.7 }} />
                  <span className="text-xs font-medium text-muted-foreground">Similar ({similar?.length || 0}) — inner ring</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border-2" style={{ borderColor: '#f59e0b', backgroundColor: '#f59e0b', opacity: 0.7 }} />
                  <span className="text-xs font-medium text-muted-foreground">Recommended ({recommended?.length || 0}) — outer ring</span>
                </div>
              </div>

              {/* Sticky tooltip */}
              {hovered && (() => {
                const pos = svgToContainer(hovered.svgX, hovered.svgY)
                return (
                <div
                  className="absolute z-50 w-56 rounded-xl border border-border/50 bg-popover/95 p-3 shadow-xl backdrop-blur-xl"
                  style={{ left: pos.px, top: pos.py - NODE_R - 10, transform: 'translate(-50%, -100%)' }}
                  onMouseEnter={onTooltipEnter}
                  onMouseLeave={onTooltipLeave}
                >
                  <div className="flex gap-3">
                    {hovered.movie.posterPath ? (
                      <img src={`${POSTER_THUMB}${hovered.movie.posterPath}`} alt={hovered.movie.title} className="h-20 w-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs">No img</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-popover-foreground text-sm">{hovered.movie.title}</p>
                      {hovered.movie.releaseDate && (
                        <p className="text-xs text-muted-foreground">{hovered.movie.releaseDate.slice(0, 4)}</p>
                      )}
                      {hovered.movie.voteAverage != null && hovered.movie.voteAverage > 0 && (
                        <Badge variant="secondary" className="mt-1 gap-1 text-[10px]">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {hovered.movie.voteAverage.toFixed(1)}
                        </Badge>
                      )}
                      <div className="mt-2">
                        <Link to={`/movie/${hovered.movie.id}`}>
                          <Button variant="outline" size="xs" className="gap-1">
                            <ExternalLink size={12} /> View details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                )
              })()}
            </>
          )}
        </div>
      )}
    </div>
  )
}
