import { Film, Users, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useGraphStore } from '@/stores/useGraphStore'

export function GraphControls() {
  const nodes = useGraphStore((s) => s.nodes)
  const movieCount = nodes.filter((n) => n.type === 'movie').length
  const personCount = nodes.filter((n) => n.type !== 'movie').length

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      {/* Legend */}
      <div className="rounded-xl border border-border/50 bg-card/90 p-3 shadow-lg backdrop-blur-md">
        <p className="text-xs font-medium text-muted-foreground mb-2">Legend</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-4 rounded-sm" style={{ backgroundColor: 'var(--primary)' }} />
            <span className="text-xs text-foreground">Movie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--chart-2)' }} />
            <span className="text-xs text-foreground">Actor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rotate-45" style={{ backgroundColor: 'var(--chart-3)' }} />
            <span className="text-xs text-foreground">Director</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--chart-4)' }} />
            <span className="text-xs text-foreground">Crew</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-1.5">
        <Badge variant="secondary" className="gap-1 text-xs">
          <Film size={12} /> {movieCount}
        </Badge>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Users size={12} /> {personCount}
        </Badge>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Layers size={12} /> {nodes.length}
        </Badge>
      </div>
    </div>
  )
}
