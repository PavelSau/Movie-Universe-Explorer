import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from './useGraphStore'
import type { GraphNode, GraphEdge } from '@/types/graph.types'

function makeNode(id: string, type: GraphNode['type'] = 'movie'): GraphNode {
  return {
    id,
    entityId: Number(id.replace(/\D/g, '') || '0'),
    type,
    label: `Node ${id}`,
    imagePath: null,
    expanded: false,
  }
}

function makeEdge(source: string, target: string, label = 'acted in'): GraphEdge {
  return { source, target, label }
}

describe('useGraphStore', () => {
  beforeEach(() => {
    useGraphStore.getState().reset()
  })

  describe('initial state', () => {
    it('has empty nodes and edges', () => {
      const { nodes, edges } = useGraphStore.getState()
      expect(nodes).toEqual([])
      expect(edges).toEqual([])
    })

    it('has empty expandedNodes set', () => {
      const { expandedNodes } = useGraphStore.getState()
      expect(expandedNodes.size).toBe(0)
    })

    it('has default zoom level of 1', () => {
      expect(useGraphStore.getState().zoomLevel).toBe(1)
    })

    it('has default filter of "all"', () => {
      expect(useGraphStore.getState().filterByType).toBe('all')
    })

    it('has default layout of "force"', () => {
      expect(useGraphStore.getState().layout).toBe('force')
    })
  })

  describe('setGraph', () => {
    it('sets nodes and edges', () => {
      const nodes = [makeNode('m1'), makeNode('p1', 'person')]
      const edges = [makeEdge('m1', 'p1')]

      useGraphStore.getState().setGraph(nodes, edges)

      const state = useGraphStore.getState()
      expect(state.nodes).toEqual(nodes)
      expect(state.edges).toEqual(edges)
    })

    it('resets expandedNodes', () => {
      useGraphStore.getState().toggleExpand('m1')
      useGraphStore.getState().setGraph([makeNode('m1')], [])

      expect(useGraphStore.getState().expandedNodes.size).toBe(0)
    })
  })

  describe('addNodes', () => {
    it('adds new nodes to existing graph', () => {
      useGraphStore.getState().setGraph([makeNode('m1')], [])
      useGraphStore.getState().addNodes([makeNode('p1', 'person')], [makeEdge('m1', 'p1')])

      const { nodes, edges } = useGraphStore.getState()
      expect(nodes).toHaveLength(2)
      expect(edges).toHaveLength(1)
    })

    it('deduplicates nodes by id', () => {
      const existingNode = makeNode('m1')
      useGraphStore.getState().setGraph([existingNode], [])

      useGraphStore.getState().addNodes([makeNode('m1'), makeNode('p1', 'person')], [makeEdge('m1', 'p1')])

      const { nodes } = useGraphStore.getState()
      expect(nodes).toHaveLength(2)
      expect(nodes.map((n) => n.id)).toEqual(['m1', 'p1'])
    })

    it('deduplicates edges', () => {
      useGraphStore.getState().setGraph(
        [makeNode('m1'), makeNode('p1', 'person')],
        [makeEdge('m1', 'p1')]
      )

      useGraphStore.getState().addNodes([], [makeEdge('m1', 'p1')])

      expect(useGraphStore.getState().edges).toHaveLength(1)
    })

    it('deduplicates reverse edges', () => {
      useGraphStore.getState().setGraph(
        [makeNode('m1'), makeNode('p1', 'person')],
        [makeEdge('m1', 'p1')]
      )

      useGraphStore.getState().addNodes([], [makeEdge('p1', 'm1')])

      expect(useGraphStore.getState().edges).toHaveLength(1)
    })

    it('creates cross-edges between existing and new nodes', () => {
      useGraphStore.getState().setGraph(
        [makeNode('m1'), makeNode('p1', 'person')],
        [makeEdge('m1', 'p1')]
      )

      // p2 connects to m1 (existing) -- this should create a cross-edge
      useGraphStore.getState().addNodes(
        [makeNode('p2', 'person')],
        [makeEdge('m1', 'p2')]
      )

      const { edges } = useGraphStore.getState()
      expect(edges).toHaveLength(2)
      expect(edges).toContainEqual(makeEdge('m1', 'p1'))
      expect(edges).toContainEqual(makeEdge('m1', 'p2'))
    })

    it('only adds edges where both endpoints exist', () => {
      useGraphStore.getState().setGraph([makeNode('m1')], [])

      // p999 does not exist in the graph and is not being added
      useGraphStore.getState().addNodes(
        [makeNode('p1', 'person')],
        [makeEdge('m1', 'p1'), makeEdge('p1', 'p999')]
      )

      const { edges } = useGraphStore.getState()
      expect(edges).toHaveLength(1)
      expect(edges[0]).toEqual(makeEdge('m1', 'p1'))
    })

    it('respects MAX_NODES cap of 1000', () => {
      const initialNodes = Array.from({ length: 998 }, (_, i) => makeNode(`n${i}`))
      useGraphStore.getState().setGraph(initialNodes, [])

      const newNodes = [makeNode('new1'), makeNode('new2'), makeNode('new3')]
      useGraphStore.getState().addNodes(newNodes, [])

      const { nodes } = useGraphStore.getState()
      // 998 existing + 2 new = 1000 (cap), new3 should be dropped
      expect(nodes).toHaveLength(1000)
      expect(nodes.map((n) => n.id)).toContain('new1')
      expect(nodes.map((n) => n.id)).toContain('new2')
      expect(nodes.map((n) => n.id)).not.toContain('new3')
    })

    it('does not add any nodes when already at MAX_NODES', () => {
      const initialNodes = Array.from({ length: 1000 }, (_, i) => makeNode(`n${i}`))
      useGraphStore.getState().setGraph(initialNodes, [])

      useGraphStore.getState().addNodes([makeNode('overflow')], [])

      expect(useGraphStore.getState().nodes).toHaveLength(1000)
    })
  })

  describe('removeChildNodes', () => {
    it('removes nodes only connected to the parent', () => {
      const nodes = [makeNode('m1'), makeNode('p1', 'person'), makeNode('p2', 'person')]
      const edges = [makeEdge('m1', 'p1'), makeEdge('m1', 'p2')]
      useGraphStore.getState().setGraph(nodes, edges)

      useGraphStore.getState().removeChildNodes('m1')

      const state = useGraphStore.getState()
      expect(state.nodes).toHaveLength(1)
      expect(state.nodes[0].id).toBe('m1')
      expect(state.edges).toHaveLength(0)
    })

    it('keeps nodes that have connections to other nodes', () => {
      // m1 -> p1, m2 -> p1 : p1 has connections to both m1 and m2
      const nodes = [makeNode('m1'), makeNode('m2'), makeNode('p1', 'person')]
      const edges = [makeEdge('m1', 'p1'), makeEdge('m2', 'p1')]
      useGraphStore.getState().setGraph(nodes, edges)

      useGraphStore.getState().removeChildNodes('m1')

      const state = useGraphStore.getState()
      // p1 should remain because it's also connected to m2
      expect(state.nodes.map((n) => n.id)).toContain('p1')
      expect(state.nodes.map((n) => n.id)).toContain('m1')
      expect(state.nodes.map((n) => n.id)).toContain('m2')
    })

    it('removes edges connected to removed nodes', () => {
      const nodes = [makeNode('m1'), makeNode('p1', 'person')]
      const edges = [makeEdge('m1', 'p1')]
      useGraphStore.getState().setGraph(nodes, edges)

      useGraphStore.getState().removeChildNodes('m1')

      expect(useGraphStore.getState().edges).toHaveLength(0)
    })

    it('removes parentId from expandedNodes', () => {
      useGraphStore.getState().setGraph([makeNode('m1')], [])
      useGraphStore.getState().toggleExpand('m1')
      expect(useGraphStore.getState().expandedNodes.has('m1')).toBe(true)

      useGraphStore.getState().removeChildNodes('m1')
      expect(useGraphStore.getState().expandedNodes.has('m1')).toBe(false)
    })

    it('removes child nodes from expandedNodes', () => {
      const nodes = [makeNode('m1'), makeNode('p1', 'person')]
      const edges = [makeEdge('m1', 'p1')]
      useGraphStore.getState().setGraph(nodes, edges)
      useGraphStore.getState().toggleExpand('p1')

      useGraphStore.getState().removeChildNodes('m1')

      expect(useGraphStore.getState().expandedNodes.has('p1')).toBe(false)
    })

    it('does nothing when parent has no children', () => {
      useGraphStore.getState().setGraph([makeNode('m1')], [])

      useGraphStore.getState().removeChildNodes('m1')

      expect(useGraphStore.getState().nodes).toHaveLength(1)
    })
  })

  describe('toggleExpand', () => {
    it('adds node to expandedNodes', () => {
      useGraphStore.getState().toggleExpand('m1')
      expect(useGraphStore.getState().expandedNodes.has('m1')).toBe(true)
    })

    it('removes node from expandedNodes on second toggle', () => {
      useGraphStore.getState().toggleExpand('m1')
      useGraphStore.getState().toggleExpand('m1')
      expect(useGraphStore.getState().expandedNodes.has('m1')).toBe(false)
    })

    it('can expand multiple nodes', () => {
      useGraphStore.getState().toggleExpand('m1')
      useGraphStore.getState().toggleExpand('m2')

      const { expandedNodes } = useGraphStore.getState()
      expect(expandedNodes.has('m1')).toBe(true)
      expect(expandedNodes.has('m2')).toBe(true)
    })
  })

  describe('setZoom', () => {
    it('updates zoom level', () => {
      useGraphStore.getState().setZoom(2.5)
      expect(useGraphStore.getState().zoomLevel).toBe(2.5)
    })

    it('accepts fractional values', () => {
      useGraphStore.getState().setZoom(0.5)
      expect(useGraphStore.getState().zoomLevel).toBe(0.5)
    })
  })

  describe('setFilter', () => {
    it('sets filter to movie', () => {
      useGraphStore.getState().setFilter('movie')
      expect(useGraphStore.getState().filterByType).toBe('movie')
    })

    it('sets filter to person', () => {
      useGraphStore.getState().setFilter('person')
      expect(useGraphStore.getState().filterByType).toBe('person')
    })

    it('sets filter back to all', () => {
      useGraphStore.getState().setFilter('movie')
      useGraphStore.getState().setFilter('all')
      expect(useGraphStore.getState().filterByType).toBe('all')
    })
  })

  describe('setLayout', () => {
    it('sets layout to radial', () => {
      useGraphStore.getState().setLayout('radial')
      expect(useGraphStore.getState().layout).toBe('radial')
    })

    it('sets layout to hierarchy', () => {
      useGraphStore.getState().setLayout('hierarchy')
      expect(useGraphStore.getState().layout).toBe('hierarchy')
    })

    it('sets layout back to force', () => {
      useGraphStore.getState().setLayout('radial')
      useGraphStore.getState().setLayout('force')
      expect(useGraphStore.getState().layout).toBe('force')
    })
  })

  describe('reset', () => {
    it('clears all state to defaults', () => {
      // Set up a complex state
      useGraphStore.getState().setGraph(
        [makeNode('m1'), makeNode('p1', 'person')],
        [makeEdge('m1', 'p1')]
      )
      useGraphStore.getState().toggleExpand('m1')
      useGraphStore.getState().setZoom(3)
      useGraphStore.getState().setFilter('movie')
      useGraphStore.getState().setLayout('radial')

      useGraphStore.getState().reset()

      const state = useGraphStore.getState()
      expect(state.nodes).toEqual([])
      expect(state.edges).toEqual([])
      expect(state.expandedNodes.size).toBe(0)
      expect(state.zoomLevel).toBe(1)
      expect(state.filterByType).toBe('all')
      expect(state.layout).toBe('force')
    })
  })
})
