import { useEffect, useRef, useState, useCallback, memo } from 'react'
import * as d3 from 'd3'
import { useGraphStore } from '@/stores/useGraphStore'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { expandNode } from '@/hooks/useGraphData'
import { GraphNodeElement } from '@/components/graph/GraphNode'
import { GraphTooltip } from '@/components/graph/GraphTooltip'
import type { GraphNode } from '@/types/graph.types'
import type { SimulationNodeDatum } from 'd3'

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

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState<string | null>(null)
  const [, forceRender] = useState(0)

  const nodes = useGraphStore((s) => s.nodes) as SimNode[]
  const edges = useGraphStore((s) => s.edges)
  const expandedNodes = useGraphStore((s) => s.expandedNodes)
  const addNodes = useGraphStore((s) => s.addNodes)
  const removeChildNodes = useGraphStore((s) => s.removeChildNodes)
  const toggleExpand = useGraphStore((s) => s.toggleExpand)

  // D3 tick handler — updates DOM directly via refs (no React re-render)
  const tickHandler = useCallback(() => {
    if (!linksRef.current || !nodesRef.current) return

    // Update link positions
    const links = linksRef.current.querySelectorAll('line')
    const storeEdges = useGraphStore.getState().edges
    const storeNodes = useGraphStore.getState().nodes as SimNode[]
    const nodeMap = new Map(storeNodes.map((n) => [n.id, n]))

    links.forEach((line, i) => {
      const edge = storeEdges[i]
      if (!edge) return
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) return
      line.setAttribute('x1', String(source.x || 0))
      line.setAttribute('y1', String(source.y || 0))
      line.setAttribute('x2', String(target.x || 0))
      line.setAttribute('y2', String(target.y || 0))
    })

    // Update node positions
    const nodeGroups = nodesRef.current.querySelectorAll<SVGGElement>('[data-node-id]')
    nodeGroups.forEach((g) => {
      const id = g.getAttribute('data-node-id')
      if (!id) return
      const node = nodeMap.get(id)
      if (!node) return
      g.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0})`)
    })
  }, [])

  // Setup zoom — once
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

    return () => {
      d3.select(svgRef.current!).on('.zoom', null)
    }
  }, [size.width, size.height])

  // Setup simulation — rebuilds when nodes/edges change
  useEffect(() => {
    if (nodes.length === 0 || size.width === 0) return

    // Build link data for D3
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const linkData = edges
      .map((e) => ({
        source: nodeMap.get(e.source),
        target: nodeMap.get(e.target),
      }))
      .filter((l): l is { source: SimNode; target: SimNode } => !!l.source && !!l.target)

    const sim = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink(linkData).distance(140).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-350).distanceMax(500))
      .force('center', d3.forceCenter(size.width / 2, size.height / 2).strength(0.05))
      .force('collision', d3.forceCollide<SimNode>().radius((d) => d.type === 'movie' ? 55 : 40))
      .alphaDecay(0.03)
      .velocityDecay(0.4)
      .on('tick', tickHandler)

    simulationRef.current = sim

    return () => { sim.stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, edges.length, size.width, size.height, tickHandler])

  // Setup drag on node elements
  useEffect(() => {
    if (!nodesRef.current || !simulationRef.current) return
    const sim = simulationRef.current

    const nodeGroups = nodesRef.current.querySelectorAll<SVGGElement>('[data-node-id]')
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

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

  // Expand/collapse on double-click, navigate tooltip handles single click info
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

  // Compute tooltip position relative to container
  const handleNodeHover = useCallback((node: GraphNode | null, svgEvent?: React.MouseEvent) => {
    setHoveredNode(node)
    if (node && svgRef.current && svgEvent) {
      const rect = svgRef.current.getBoundingClientRect()
      const t = transformRef.current
      const screenX = (node.x || 0) * t.k + t.x + rect.left
      const screenY = (node.y || 0) * t.k + t.y + rect.top
      setTooltipPos({ x: screenX, y: screenY })
    }
  }, [])

  // Zoom controls (called from GraphControls)
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.4)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7)
  }, [])

  const handleZoomReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(500).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(size.width / 2, size.height / 2).scale(0.8).translate(-size.width / 2, -size.height / 2)
    )
  }, [size.width, size.height])

  if (size.width === 0) {
    return <div ref={containerRef} className="h-full w-full" />
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        className="cursor-grab active:cursor-grabbing"
      >
        <g ref={gRef}>
          {/* Edges */}
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

          {/* Nodes */}
          <g ref={nodesRef}>
            {nodes.map((node) => (
              <MemoizedGraphNode
                key={node.id}
                node={node}
                isExpanded={expandedNodes.has(node.id)}
                isLoading={loading === node.id}
                onClick={() => handleNodeClick(node as SimNode)}
                onMouseEnter={(e) => handleNodeHover(node, e)}
                onMouseLeave={() => handleNodeHover(null)}
              />
            ))}
          </g>
        </g>
      </svg>

      {hoveredNode && (
        <GraphTooltip node={hoveredNode} x={tooltipPos.x} y={tooltipPos.y} containerRef={svgRef} />
      )}

      {/* Zoom controls overlay */}
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleZoomReset} />
    </div>
  )
}

// Memoized node to prevent re-rendering unchanged nodes
const MemoizedGraphNode = memo(GraphNodeElement, (prev, next) =>
  prev.node.id === next.node.id &&
  prev.isExpanded === next.isExpanded &&
  prev.isLoading === next.isLoading
)

// Inline zoom controls
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function ZoomControls({ onZoomIn, onZoomOut, onReset }: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 rounded-xl border border-border/50 bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
      <Button variant="ghost" size="icon-sm" onClick={onZoomIn} aria-label="Zoom in">
        <ZoomIn size={16} />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onZoomOut} aria-label="Zoom out">
        <ZoomOut size={16} />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onReset} aria-label="Fit to view">
        <Maximize2 size={16} />
      </Button>
    </div>
  )
}
