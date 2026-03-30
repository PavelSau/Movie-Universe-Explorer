export type NodeType = 'movie' | 'actor' | 'director' | 'crew' | 'person'

export interface GraphNode {
  id: string
  entityId: number
  type: NodeType
  label: string
  sublabel?: string
  imagePath: string | null
  expanded: boolean
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphEdge {
  source: string
  target: string
  label: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
