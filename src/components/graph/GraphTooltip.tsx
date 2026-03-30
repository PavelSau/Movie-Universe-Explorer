import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GraphNode } from '@/types/graph.types'

interface GraphTooltipProps {
  node: GraphNode
  x: number
  y: number
  containerRef: React.RefObject<SVGSVGElement | null>
}

const typeLabels: Record<string, string> = {
  movie: 'Movie',
  actor: 'Actor',
  director: 'Director',
  crew: 'Crew',
  person: 'Person',
}

export function GraphTooltip({ node, x, y, containerRef }: GraphTooltipProps) {
  // Convert SVG-world position to viewport-relative position
  const rect = containerRef.current?.getBoundingClientRect()
  const left = rect ? x - rect.left + 40 : 0
  const top = rect ? y - rect.top - 20 : 0

  const detailPath = node.type === 'movie'
    ? `/movie/${node.entityId}`
    : `/person/${node.entityId}`

  return (
    <div
      className="pointer-events-auto absolute z-50 max-w-xs rounded-lg border border-border/50 bg-popover/95 px-3 py-2 text-sm shadow-xl backdrop-blur-xl"
      style={{ left, top }}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      <p className="font-semibold text-foreground">{node.label}</p>
      {node.sublabel && (
        <p className="text-xs text-muted-foreground">{node.sublabel}</p>
      )}
      <p className="mt-1 text-xs text-primary">{typeLabels[node.type] || node.type}</p>
      <div className="mt-2 flex items-center gap-2">
        <Link to={detailPath}>
          <Button variant="outline" size="xs" className="gap-1">
            <ExternalLink size={12} /> View details
          </Button>
        </Link>
        <span className="text-[10px] text-muted-foreground">
          Click node to {node.expanded ? 'collapse' : 'expand'}
        </span>
      </div>
    </div>
  )
}
