import { useState, useCallback, useEffect } from 'react'
import { Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { GraphControls } from '@/components/graph/GraphControls'
import { useGraphStore } from '@/stores/useGraphStore'
import { fetchMovieGraph, fetchPersonGraph } from '@/hooks/useGraphData'
import { Skeleton } from '@/components/ui/skeleton'

interface GraphViewProps {
  entityType: 'movie' | 'person'
  entityId: number
  title: string
  imagePath: string | null
  knownFor?: string | null
}

export function GraphView({ entityType, entityId, title, imagePath, knownFor }: GraphViewProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const setGraph = useGraphStore((s) => s.setGraph)
  const reset = useGraphStore((s) => s.reset)
  const nodeCount = useGraphStore((s) => s.nodes.length)

  const loadGraph = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = entityType === 'movie'
        ? await fetchMovieGraph(entityId, title, imagePath)
        : await fetchPersonGraph(entityId, title, imagePath, knownFor || null)
      setGraph(result.nodes, result.edges)
    } finally {
      setIsLoading(false)
    }
  }, [entityType, entityId, title, imagePath, knownFor, setGraph])

  const handleToggle = useCallback(() => {
    if (isVisible) {
      reset()
      setIsVisible(false)
    } else {
      setIsVisible(true)
      loadGraph()
    }
  }, [isVisible, reset, loadGraph])

  // Reset graph when navigating to a different entity
  useEffect(() => {
    return () => reset()
  }, [entityId, reset])

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Network size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Connection Graph</h2>
            <p className="text-sm text-muted-foreground">
              {isVisible ? `${nodeCount} nodes · Click to expand · Drag to move · Scroll to zoom` : 'Explore relationships visually'}
            </p>
          </div>
        </div>
        <Button
          variant={isVisible ? 'default' : 'outline'}
          onClick={handleToggle}
          className="gap-2"
        >
          <Network size={16} />
          {isVisible ? 'Hide Graph' : 'Show Graph'}
        </Button>
      </div>

      <Separator className="mb-6 bg-border/50" />

      {isVisible && (
        <div className="relative h-[70vh] rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                <p className="text-muted-foreground">Loading graph data...</p>
              </div>
            </div>
          ) : (
            <>
              <GraphCanvas />
              <GraphControls />
            </>
          )}
        </div>
      )}
    </div>
  )
}
