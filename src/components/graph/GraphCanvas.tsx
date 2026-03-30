import { useEffect, useRef, useState, useCallback, memo } from 'react'
import * as d3 from 'd3'
import { useGraphStore, type GraphLayout } from '@/stores/useGraphStore'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { expandNode } from '@/hooks/useGraphData'
import { GraphNodeElement } from '@/components/graph/GraphNode'
import { GraphTooltip } from '@/components/graph/GraphTooltip'
import type { GraphNode } from '@/types/graph.types'
import type { SimulationNodeDatum } from 'd3'
import { ZoomIn, ZoomOut, Home, Maximize, Network, GitBranch, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type SimNode = GraphNode & SimulationNodeDatum

export function GraphCanvas() {
  const [containerRef, size] = useResizeObserver()
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const linksRef = useRef<SVGGElement>(null)
  const nodesRef = useRef<SVGGElement>(null)
  const simulationRef = useRef<d3.Simulation<SimNode, never> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const transformRef = useRef(d3.zoomIdentity)
  const graphContainerRef = useRef<HTMLDivElement>(null)

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState<string | null>(null)
  const [, forceRender] = useState(0)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipHoveredRef = useRef(false)

  const nodes = useGraphStore((s) => s.nodes) as SimNode[]
  const edges = useGraphStore((s) => s.edges)
  const expandedNodes = useGraphStore((s) => s.expandedNodes)
  const layout = useGraphStore((s) => s.layout)
  const setLayout = useGraphStore((s) => s.setLayout)
  const addNodes = useGraphStore((s) => s.addNodes)
  const removeChildNodes = useGraphStore((s) => s.removeChildNodes)
  const toggleExpand = useGraphStore((s) => s.toggleExpand)

  // D3 tick — direct DOM updates, no React re-render
  const tickHandler = useCallback(() => {
    if (!linksRef.current || !nodesRef.current) return

    const storeEdges = useGraphStore.getState().edges
    const storeNodes = useGraphStore.getState().nodes as SimNode[]
    const nodeMap = new Map(storeNodes.map((n) => [n.id, n]))

    const links = linksRef.current.querySelectorAll('line')
    links.forEach((line, i) => {
      const edge = storeEdges[i]
      if (!edge) return
      const s = nodeMap.get(edge.source)
      const t = nodeMap.get(edge.target)
      if (!s || !t) return
      line.setAttribute('x1', String(s.x || 0))
      line.setAttribute('y1', String(s.y || 0))
      line.setAttribute('x2', String(t.x || 0))
      line.setAttribute('y2', String(t.y || 0))
    })

    const nodeGroups = nodesRef.current.querySelectorAll<SVGGElement>('[data-node-id]')
    nodeGroups.forEach((g) => {
      const id = g.getAttribute('data-node-id')
      if (!id) return
      const node = nodeMap.get(id)
      if (!node) return
      g.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0})`)
    })
  }, [])

  // Zoom setup
  useEffect(() => {
    if (!svgRef.current || !gRef.current || size.width === 0) return

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        transformRef.current = event.transform
        gRef.current!.setAttribute(
          'transform',
          `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`
        )
      })

    d3.select(svgRef.current).call(zoom)
    zoomRef.current = zoom

    return () => { d3.select(svgRef.current!).on('.zoom', null) }
  }, [size.width, size.height])

  // Build and apply layout
  useEffect(() => {
    if (nodes.length === 0 || size.width === 0) return

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const linkData = edges
      .map((e) => ({ source: nodeMap.get(e.source), target: nodeMap.get(e.target) }))
      .filter((l): l is { source: SimNode; target: SimNode } => !!l.source && !!l.target)

    // Stop previous simulation
    simulationRef.current?.stop()

    const cx = size.width / 2
    const cy = size.height / 2

    if (layout === 'radial') {
      // Radial layout: root at center, others in concentric rings
      const rootNode = nodes.find((n) => n.expanded) || nodes[0]
      const connected = new Map<string, number>() // nodeId -> depth
      connected.set(rootNode.id, 0)

      // BFS to assign depths
      const queue = [rootNode.id]
      while (queue.length > 0) {
        const current = queue.shift()!
        const depth = connected.get(current)!
        edges.forEach((e) => {
          const neighbor = e.source === current ? e.target : e.target === current ? e.source : null
          if (neighbor && !connected.has(neighbor)) {
            connected.set(neighbor, depth + 1)
            queue.push(neighbor)
          }
        })
      }

      // Position nodes in concentric circles
      const depthGroups = new Map<number, string[]>()
      connected.forEach((depth, id) => {
        if (!depthGroups.has(depth)) depthGroups.set(depth, [])
        depthGroups.get(depth)!.push(id)
      })

      depthGroups.forEach((ids, depth) => {
        const radius = depth * 160
        ids.forEach((id, i) => {
          const node = nodeMap.get(id)
          if (!node) return
          if (depth === 0) {
            node.x = cx
            node.y = cy
          } else {
            const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2
            node.x = cx + radius * Math.cos(angle)
            node.y = cy + radius * Math.sin(angle)
          }
          node.fx = node.x
          node.fy = node.y
        })
      })

      // Light simulation just for collision
      const sim = d3.forceSimulation<SimNode>(nodes)
        .force('collision', d3.forceCollide<SimNode>().radius((d) => d.type === 'movie' ? 55 : 40))
        .alphaDecay(0.1)
        .on('tick', tickHandler)

      simulationRef.current = sim
      // Release fixed positions after settling
      setTimeout(() => {
        nodes.forEach((n) => { n.fx = null; n.fy = null })
      }, 500)

    } else if (layout === 'hierarchy') {
      // Tree/hierarchy layout: root at top, children below
      const rootNode = nodes.find((n) => n.expanded) || nodes[0]

      // Build adjacency for BFS
      const adj = new Map<string, string[]>()
      nodes.forEach((n) => adj.set(n.id, []))
      edges.forEach((e) => {
        adj.get(e.source)?.push(e.target)
        adj.get(e.target)?.push(e.source)
      })

      // BFS tree
      const visited = new Set<string>()
      const levels: string[][] = []
      visited.add(rootNode.id)
      let currentLevel = [rootNode.id]

      while (currentLevel.length > 0) {
        levels.push(currentLevel)
        const nextLevel: string[] = []
        currentLevel.forEach((id) => {
          (adj.get(id) || []).forEach((neighbor) => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor)
              nextLevel.push(neighbor)
            }
          })
        })
        currentLevel = nextLevel
      }

      // Position: each level is a row
      const levelHeight = 150
      const startY = cy - ((levels.length - 1) * levelHeight) / 2

      levels.forEach((ids, depth) => {
        const levelWidth = Math.min(size.width - 100, ids.length * 120)
        const startX = cx - levelWidth / 2
        const spacing = ids.length > 1 ? levelWidth / (ids.length - 1) : 0

        ids.forEach((id, i) => {
          const node = nodeMap.get(id)
          if (!node) return
          node.x = ids.length === 1 ? cx : startX + spacing * i
          node.y = startY + depth * levelHeight
          node.fx = node.x
          node.fy = node.y
        })
      })

      const sim = d3.forceSimulation<SimNode>(nodes)
        .force('collision', d3.forceCollide<SimNode>().radius((d) => d.type === 'movie' ? 55 : 40))
        .alphaDecay(0.1)
        .on('tick', tickHandler)

      simulationRef.current = sim
      setTimeout(() => {
        nodes.forEach((n) => { n.fx = null; n.fy = null })
      }, 800)

    } else {
      // Default: force-directed
      const sim = d3.forceSimulation<SimNode>(nodes)
        .force('link', d3.forceLink(linkData).distance(140).strength(0.4))
        .force('charge', d3.forceManyBody().strength(-350).distanceMax(500))
        .force('center', d3.forceCenter(cx, cy).strength(0.05))
        .force('collision', d3.forceCollide<SimNode>().radius((d) => d.type === 'movie' ? 55 : 40))
        .alphaDecay(0.03)
        .velocityDecay(0.4)
        .on('tick', tickHandler)

      simulationRef.current = sim
    }

    return () => { simulationRef.current?.stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, edges.length, size.width, size.height, layout, tickHandler])

  // D3 drag on nodes
  useEffect(() => {
    if (!nodesRef.current || !simulationRef.current) return
    const sim = simulationRef.current
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    const nodeGroups = nodesRef.current.querySelectorAll<SVGGElement>('[data-node-id]')
    nodeGroups.forEach((g) => {
      const id = g.getAttribute('data-node-id')
      if (!id) return
      const node = nodeMap.get(id)
      if (!node) return

      const drag = d3.drag<SVGGElement, unknown>()
        .on('start', (event) => {
          if (!event.active) sim.alphaTarget(0.3).restart()
          node.fx = node.x
          node.fy = node.y
        })
        .on('drag', (event) => {
          node.fx = event.x
          node.fy = event.y
        })
        .on('end', (event) => {
          if (!event.active) sim.alphaTarget(0)
          node.fx = null
          node.fy = null
        })

      d3.select(g).call(drag)
    })
  }, [nodes, nodes.length])

  // Expand/collapse
  const handleNodeClick = useCallback(async (node: SimNode) => {
    if (expandedNodes.has(node.id)) {
      removeChildNodes(node.id)
      toggleExpand(node.id)
      forceRender((n) => n + 1)
      return
    }
    setLoading(node.id)
    try {
      const { nodes: newNodes, edges: newEdges } = await expandNode(node)
      addNodes(newNodes, newEdges)
      toggleExpand(node.id)
      forceRender((n) => n + 1)
    } finally {
      setLoading(null)
    }
  }, [expandedNodes, addNodes, removeChildNodes, toggleExpand])

  // Tooltip with delayed hide so user can reach the tooltip to click links
  const showTooltip = useCallback((node: GraphNode, _e?: React.MouseEvent) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setHoveredNode(node)
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const t = transformRef.current
      setTooltipPos({
        x: (node.x || 0) * t.k + t.x + rect.left,
        y: (node.y || 0) * t.k + t.y + rect.top,
      })
    }
  }, [])

  const scheduleHideTooltip = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      if (!tooltipHoveredRef.current) {
        setHoveredNode(null)
      }
    }, 300)
  }, [])

  const handleTooltipEnter = useCallback(() => {
    tooltipHoveredRef.current = true
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const handleTooltipLeave = useCallback(() => {
    tooltipHoveredRef.current = false
    setHoveredNode(null)
  }, [])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.4)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7)
  }, [])

  const handleHome = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(500).call(
      zoomRef.current.transform, d3.zoomIdentity
    )
  }, [])

  const handleFullscreen = useCallback(() => {
    const el = graphContainerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen()
    }
  }, [])

  if (size.width === 0) {
    return <div ref={containerRef} className="h-full w-full" />
  }

  return (
    <div ref={(el) => {
      (containerRef as React.RefObject<HTMLDivElement | null>).current = el
      graphContainerRef.current = el
    }} className="relative h-full w-full bg-background rounded-xl">
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        className="cursor-grab active:cursor-grabbing"
      >
        <g ref={gRef}>
          <g ref={linksRef}>
            {edges.map((edge, i) => (
              <line
                key={`${edge.source}-${edge.target}-${i}`}
                className="stroke-border"
                strokeWidth={1.5}
                strokeOpacity={0.4}
              />
            ))}
          </g>
          <g ref={nodesRef}>
            {nodes.map((node) => (
              <MemoizedGraphNode
                key={node.id}
                node={node}
                isExpanded={expandedNodes.has(node.id)}
                isLoading={loading === node.id}
                onClick={() => handleNodeClick(node as SimNode)}
                onMouseEnter={(e) => showTooltip(node, e)}
                onMouseLeave={scheduleHideTooltip}
              />
            ))}
          </g>
        </g>
      </svg>

      {hoveredNode && (
        <GraphTooltip
          node={hoveredNode}
          x={tooltipPos.x}
          y={tooltipPos.y}
          containerRef={svgRef}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
        />
      )}

      {/* Controls overlay — top left */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Zoom + view */}
        <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
          <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} aria-label="Zoom in">
            <ZoomIn size={16} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} aria-label="Zoom out">
            <ZoomOut size={16} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleHome} aria-label="Reset view">
            <Home size={16} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleFullscreen} aria-label="Fullscreen">
            <Maximize size={16} />
          </Button>
        </div>

        {/* Layout picker */}
        <div className="rounded-xl border border-border/50 bg-card/90 p-2 shadow-lg backdrop-blur-md">
          <p className="text-[10px] font-medium text-muted-foreground mb-1.5 px-0.5">Layout</p>
          <ToggleGroup
            value={[layout]}
            onValueChange={(v) => { if (v.length > 0) setLayout(v[0] as GraphLayout) }}
            className="flex-col gap-1"
          >
            <ToggleGroupItem value="force" className="w-full justify-start gap-2 px-2 py-1 text-xs data-[pressed]:bg-primary data-[pressed]:text-primary-foreground">
              <Network size={12} /> Force
            </ToggleGroupItem>
            <ToggleGroupItem value="radial" className="w-full justify-start gap-2 px-2 py-1 text-xs data-[pressed]:bg-primary data-[pressed]:text-primary-foreground">
              <Circle size={12} /> Radial
            </ToggleGroupItem>
            <ToggleGroupItem value="hierarchy" className="w-full justify-start gap-2 px-2 py-1 text-xs data-[pressed]:bg-primary data-[pressed]:text-primary-foreground">
              <GitBranch size={12} /> Hierarchy
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
}

const MemoizedGraphNode = memo(GraphNodeElement, (prev, next) =>
  prev.node.id === next.node.id &&
  prev.isExpanded === next.isExpanded &&
  prev.isLoading === next.isLoading
)
