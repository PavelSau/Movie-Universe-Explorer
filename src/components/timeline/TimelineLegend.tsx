import type { Genre } from '@/types/timeline.types'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

interface TimelineLegendProps {
  genreColorMap: Map<number, string>
  genreMap: Map<number, Genre>
}

export function TimelineLegend({ genreColorMap, genreMap }: TimelineLegendProps) {
  const entries = Array.from(genreColorMap.entries())
    .map(([genreId, color]) => ({
      genreId,
      color,
      name: genreMap.get(genreId)?.name ?? 'Other',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3 px-2 pt-3">
      {entries.map(({ genreId, color, name }) => (
        <div key={genreId} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  )
}

export { CHART_COLORS }
