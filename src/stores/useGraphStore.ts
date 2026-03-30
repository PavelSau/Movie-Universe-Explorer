import { create } from 'zustand'
import type { GraphNode, GraphEdge } from '@/types/graph.types'

interface GraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  expandedNodes: Set<string>
  zoomLevel: number
  filterByType: 'all' | 'movie' | 'person'

  setGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void
  addNodes: (nodes: GraphNode[], edges: GraphEdge[]) => void
  removeChildNodes: (parentId: string) => void
  toggleExpand: (nodeId: string) => void
  setZoom: (zoom: number) => void
  setFilter: (filter: 'all' | 'movie' | 'person') => void
  reset: () => void
}

const MAX_NODES = 150

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  expandedNodes: new Set(),
  zoomLevel: 1,
  filterByType: 'all',

  setGraph: (nodes, edges) => set({ nodes, edges, expandedNodes: new Set() }),

  addNodes: (newNodes, newEdges) => {
    const { nodes, edges } = get()
    const existingIds = new Set(nodes.map((n) => n.id))

    // Separate truly new nodes from already-existing ones
    const toAdd: GraphNode[] = []
    for (const node of newNodes) {
      if (existingIds.has(node.id)) continue
      if (nodes.length + toAdd.length >= MAX_NODES) break
      toAdd.push(node)
    }

    const allIds = new Set([...existingIds, ...toAdd.map((n) => n.id)])

    // Add ALL edges where both endpoints exist (this creates connections to existing nodes)
    const existingEdgeKeys = new Set(edges.map((e) => `${e.source}-${e.target}`))
    const validNewEdges = newEdges.filter((e) =>
      allIds.has(e.source) && allIds.has(e.target) &&
      !existingEdgeKeys.has(`${e.source}-${e.target}`) &&
      !existingEdgeKeys.has(`${e.target}-${e.source}`)
    )

    set({
      nodes: [...nodes, ...toAdd],
      edges: [...edges, ...validNewEdges],
    })
  },

  removeChildNodes: (parentId) => {
    const { nodes, edges, expandedNodes } = get()
    // Find direct children connected only to this parent
    const parentEdges = edges.filter((e) => e.source === parentId || e.target === parentId)
    const childCandidates = new Set(
      parentEdges.map((e) => (e.source === parentId ? e.target : e.source))
    )

    // Keep nodes that have connections to other nodes (besides the parent being collapsed)
    const toRemove = new Set<string>()
    for (const childId of childCandidates) {
      if (childId === parentId) continue
      const otherEdges = edges.filter(
        (e) => (e.source === childId || e.target === childId) &&
               e.source !== parentId && e.target !== parentId
      )
      if (otherEdges.length === 0) {
        toRemove.add(childId)
      }
    }

    const newExpanded = new Set(expandedNodes)
    newExpanded.delete(parentId)
    toRemove.forEach((id) => newExpanded.delete(id))

    set({
      nodes: nodes.filter((n) => !toRemove.has(n.id)),
      edges: edges.filter((e) => !toRemove.has(e.source) && !toRemove.has(e.target)),
      expandedNodes: newExpanded,
    })
  },

  toggleExpand: (nodeId) => {
    const { expandedNodes } = get()
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    set({ expandedNodes: newExpanded })
  },

  setZoom: (zoom) => set({ zoomLevel: zoom }),
  setFilter: (filter) => set({ filterByType: filter }),
  reset: () => set({ nodes: [], edges: [], expandedNodes: new Set(), zoomLevel: 1, filterByType: 'all' }),
}))
