import type { GraphNode } from '@/types/graph.types'
import { POSTER_SIZES, PROFILE_SIZES } from '@/utils/constants'
import { Loader2 } from 'lucide-react'

interface GraphNodeProps {
  node: GraphNode
  isExpanded: boolean
  isLoading: boolean
  onClick: () => void
  onMouseEnter: (e: React.MouseEvent) => void
  onMouseLeave: () => void
}

const NODE_COLORS: Record<string, { fill: string; stroke: string }> = {
  movie: { fill: 'var(--primary)', stroke: 'var(--primary)' },
  actor: { fill: 'var(--chart-2)', stroke: 'var(--chart-2)' },
  director: { fill: 'var(--chart-3)', stroke: 'var(--chart-3)' },
  crew: { fill: 'var(--chart-4)', stroke: 'var(--chart-4)' },
  person: { fill: 'var(--chart-5)', stroke: 'var(--chart-5)' },
}

// SVG icon paths (from Lucide)
const ICON_FILM = 'M7 2v11m3-11v11m3-11v11m3-11v11M4.18 2h15.64c.65 0 .97 0 1.22.13a1.16 1.16 0 0 1 .5.5c.14.25.14.58.14 1.22v8.3c0 .65 0 .97-.13 1.22a1.16 1.16 0 0 1-.5.5c-.26.13-.58.13-1.23.13H4.18c-.65 0-.97 0-1.22-.13a1.16 1.16 0 0 1-.5-.5C2.32 13.12 2.32 12.8 2.32 12.15V3.85c0-.64 0-.97.13-1.22a1.16 1.16 0 0 1 .5-.5C3.21 2 3.53 2 4.18 2Z'
const ICON_USER = 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'
const ICON_MEGAPHONE = 'M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6'

function PlaceholderIcon({ type, size }: { type: string; size: number }) {
  const iconPath = type === 'movie' ? ICON_FILM : type === 'director' ? ICON_MEGAPHONE : ICON_USER
  const half = size / 2
  const iconScale = size / 24 * 0.55
  return (
    <g transform={`translate(${-half * 0.55}, ${-half * 0.55}) scale(${iconScale})`} opacity={0.5}>
      <path d={iconPath} fill="none" stroke="var(--muted-foreground)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

export function GraphNodeElement({
  node,
  isExpanded,
  isLoading,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: GraphNodeProps) {
  const colors = NODE_COLORS[node.type] || NODE_COLORS.person
  const isMovie = node.type === 'movie'
  const isDirector = node.type === 'director'

  return (
    <g
      data-node-id={node.id}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="cursor-pointer"
      style={{ willChange: 'transform' }}
    >
      {/* Expanded glow */}
      {isExpanded && (
        isMovie ? (
          <rect x={-36} y={-50} width={72} height={100} rx={10}
            fill="none" stroke={colors.stroke} strokeWidth={3} strokeOpacity={0.3} />
        ) : isDirector ? (
          <polygon points="0,-36 36,0 0,36 -36,0"
            fill="none" stroke={colors.stroke} strokeWidth={3} strokeOpacity={0.3} />
        ) : (
          <circle r={34} fill="none" stroke={colors.stroke} strokeWidth={3} strokeOpacity={0.3} />
        )
      )}

      {/* Shape + image/placeholder */}
      {isMovie ? (
        <>
          <rect x={-30} y={-44} width={60} height={88} rx={8}
            fill="var(--card)" stroke={colors.stroke} strokeWidth={2} />
          <clipPath id={`clip-${node.id}`}>
            <rect x={-26} y={-40} width={52} height={72} rx={5} />
          </clipPath>
          {node.imagePath ? (
            <image href={`${POSTER_SIZES.thumbnail}${node.imagePath}`}
              x={-26} y={-40} width={52} height={72}
              clipPath={`url(#clip-${node.id})`} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <>
              <rect x={-26} y={-40} width={52} height={72} rx={5} fill="var(--muted)" />
              <PlaceholderIcon type="movie" size={52} />
            </>
          )}
        </>
      ) : isDirector ? (
        <>
          <polygon points="0,-30 30,0 0,30 -30,0"
            fill="var(--card)" stroke={colors.stroke} strokeWidth={2} />
          <clipPath id={`clip-${node.id}`}><circle r={18} /></clipPath>
          {node.imagePath ? (
            <image href={`${PROFILE_SIZES.thumbnail}${node.imagePath}`}
              x={-18} y={-18} width={36} height={36}
              clipPath={`url(#clip-${node.id})`} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <>
              <circle r={18} fill="var(--muted)" />
              <PlaceholderIcon type="director" size={36} />
            </>
          )}
        </>
      ) : (
        <>
          <circle r={28} fill="var(--card)" stroke={colors.stroke} strokeWidth={2} />
          <clipPath id={`clip-${node.id}`}><circle r={24} /></clipPath>
          {node.imagePath ? (
            <image href={`${PROFILE_SIZES.thumbnail}${node.imagePath}`}
              x={-24} y={-24} width={48} height={48}
              clipPath={`url(#clip-${node.id})`} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <>
              <circle r={24} fill="var(--muted)" />
              <PlaceholderIcon type="person" size={48} />
            </>
          )}
        </>
      )}

      {/* Label */}
      <text y={isMovie ? 56 : 42} textAnchor="middle"
        className="fill-foreground text-[10px] font-medium" style={{ pointerEvents: 'none' }}>
        {node.label.length > 16 ? node.label.slice(0, 14) + '…' : node.label}
      </text>

      {/* Type indicator */}
      <text y={isMovie ? 67 : 53} textAnchor="middle"
        className="fill-muted-foreground text-[8px]" style={{ pointerEvents: 'none' }}>
        {isMovie ? 'Movie' : isDirector ? 'Director' : node.type === 'actor' ? 'Actor' : node.sublabel || node.type}
      </text>

      {/* Loading spinner */}
      {isLoading && (
        <foreignObject x={-10} y={-10} width={20} height={20}>
          <Loader2 size={20} className="animate-spin text-primary" />
        </foreignObject>
      )}
    </g>
  )
}
