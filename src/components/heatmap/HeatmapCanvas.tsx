import { useMemo } from 'react'
import { ResponsiveHeatMap } from '@nivo/heatmap'
import type { HeatmapData, HeatmapMetric } from '@/types/heatmap.types'

interface HeatmapCanvasProps {
  data: HeatmapData
  metric: HeatmapMetric
}

// Custom diverging scale using our app's violet palette
// From muted background → mid accent → intense primary
const COLOR_STOPS = [
  '#e8e0f0', // very light lavender (low values)
  '#c4a8e0', // soft purple
  '#9b6dd0', // medium violet
  '#7c3aed', // vivid violet (matches our primary hue 277)
  '#5b21b6', // deep violet (high values)
]

const COLOR_STOPS_DARK = [
  '#1e1533', // deep purple-black (low values)
  '#3b2066', // dark violet
  '#6d3abf', // medium violet
  '#8b5cf6', // bright violet (matches dark primary)
  '#a78bfa', // light violet (high values — bright on dark bg)
]

function getStops(): string[] {
  const isDark = document.documentElement.classList.contains('dark')
  return isDark ? COLOR_STOPS_DARK : COLOR_STOPS
}

export function HeatmapCanvas({ data, metric }: HeatmapCanvasProps) {
  const nivoData = useMemo(() => {
    const genreMap = new Map<string, Map<number, { avg: number; count: number }>>()

    for (const cell of data.cells) {
      if (!genreMap.has(cell.genreName)) {
        genreMap.set(cell.genreName, new Map())
      }
      genreMap.get(cell.genreName)!.set(cell.decade, {
        avg: cell.avgRating,
        count: cell.movieCount,
      })
    }

    return Array.from(genreMap.entries()).map(([genreName, decades]) => ({
      id: genreName,
      data: data.decades.map((decade) => {
        const cell = decades.get(decade)
        return {
          x: `${decade}s`,
          y: cell ? (metric === 'avgRating' ? cell.avg : cell.count) : null,
        }
      }),
    }))
  }, [data, metric])

  const stops = getStops()

  return (
    <ResponsiveHeatMap
      data={nivoData}
      margin={{ top: 20, right: 30, bottom: 60, left: 120 }}
      xOuterPadding={0.1}
      yOuterPadding={0.1}
      xInnerPadding={0.06}
      yInnerPadding={0.06}
      valueFormat={(v) =>
        metric === 'avgRating' ? `${Number(v).toFixed(1)} ★` : `${v} movies`
      }
      colors={{
        type: 'quantize',
        colors: stops,
      }}
      emptyColor="var(--muted)"
      borderRadius={4}
      borderWidth={0}
      enableLabels={true}
      labelTextColor={{ from: 'color', modifiers: [['brighter', 3]] }}
      axisTop={null}
      axisBottom={{
        tickSize: 0,
        tickPadding: 10,
        legend: 'Decade',
        legendPosition: 'middle',
        legendOffset: 45,
      }}
      axisLeft={{
        tickSize: 0,
        tickPadding: 10,
      }}
      theme={{
        text: { fill: 'var(--foreground)', fontFamily: 'Geist Variable, sans-serif' },
        axis: {
          ticks: { text: { fill: 'var(--muted-foreground)', fontSize: 12 } },
          legend: { text: { fill: 'var(--muted-foreground)', fontSize: 13, fontWeight: 600 } },
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
      animate={false}
      hoverTarget="cell"
      opacity={1}
      activeOpacity={1}
      inactiveOpacity={0.35}
    />
  )
}
