import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { POSTER_SIZES } from '@/utils/constants'
import type { TimelineItem, Genre } from '@/types/timeline.types'

interface TimelineTooltipProps {
  item: TimelineItem
  x: number
  y: number
  genreMap: Map<number, Genre>
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function TimelineTooltip({
  item,
  x,
  y,
  genreMap,
  onMouseEnter,
  onMouseLeave,
}: TimelineTooltipProps) {
  const genreName = item.primaryGenreId
    ? genreMap.get(item.primaryGenreId)?.name ?? 'Unknown'
    : 'Unknown'

  return (
    <div
      className="pointer-events-auto fixed z-50 w-64 rounded-xl border border-border/50 bg-popover/95 p-3 shadow-xl backdrop-blur-xl"
      style={{ left: x, top: y, transform: 'translate(-50%, -110%)' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex gap-3">
        {item.posterPath ? (
          <img
            src={`${POSTER_SIZES.thumbnail}${item.posterPath}`}
            alt={item.title}
            className="h-20 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Star size={16} className="text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-popover-foreground">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.year}</p>
          {item.character && (
            <p className="mt-0.5 truncate text-xs text-primary">as {item.character}</p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            {item.voteAverage > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                {item.voteAverage.toFixed(1)}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {genreName}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
