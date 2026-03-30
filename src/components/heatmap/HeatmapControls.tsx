import { Star, Film } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { HeatmapMetric } from '@/types/heatmap.types'

interface HeatmapControlsProps {
  metric: HeatmapMetric
  onMetricChange: (metric: HeatmapMetric) => void
}

export function HeatmapControls({ metric, onMetricChange }: HeatmapControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Metric:</span>
      <ToggleGroup
        value={[metric]}
        onValueChange={(v) => {
          if (v.length > 0) onMetricChange(v[0] as HeatmapMetric)
        }}
      >
        <ToggleGroupItem
          value="avgRating"
          className="gap-1.5 px-3 py-1.5 text-sm data-[pressed]:bg-primary data-[pressed]:text-primary-foreground"
        >
          <Star size={14} />
          Average Rating
        </ToggleGroupItem>
        <ToggleGroupItem
          value="movieCount"
          className="gap-1.5 px-3 py-1.5 text-sm data-[pressed]:bg-primary data-[pressed]:text-primary-foreground"
        >
          <Film size={14} />
          Movie Count
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
