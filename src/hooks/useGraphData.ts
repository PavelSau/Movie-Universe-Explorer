import { api } from '@/services/api'
import type { GraphNode, GraphEdge } from '@/types/graph.types'
import type { MovieCredits } from '@/types/movie.types'
import type { PersonCredits } from '@/types/person.types'
import { MAX_GRAPH_CHILD_NODES } from '@/utils/constants'

function mediaNodeId(mediaType: string, id: number): string {
  return mediaType === 'movie' ? `movie-${id}` : `tv-${id}`
}

/** Limit child nodes (keeps root at index 0 for initial graphs, pure children for expand) */
function capNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  limit: number,
  hasRoot: boolean,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const maxChildren = limit
  const childStart = hasRoot ? 1 : 0
  const children = nodes.slice(childStart)

  if (children.length <= maxChildren) return { nodes, edges }

  const kept = hasRoot ? [nodes[0]] : []
  kept.push(...children.slice(0, maxChildren))
  const keptIds = new Set(kept.map((n) => n.id))

  return {
    nodes: kept,
    edges: edges.filter((e) => keptIds.has(e.source) || keptIds.has(e.target)),
  }
}

export async function fetchMovieGraph(
  movieId: number,
  movieTitle: string,
  posterPath: string | null,
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const { data: credits } = await api.get<MovieCredits>(`/movie/${movieId}/credits`)

  const rootId = `movie-${movieId}`
  const rootNode: GraphNode = {
    id: rootId,
    entityId: movieId,
    type: 'movie',
    label: movieTitle,
    imagePath: posterPath,
    expanded: true,
  }

  const nodes: GraphNode[] = [rootNode]
  const edges: GraphEdge[] = []
  const seenIds = new Set<string>([rootId])

  credits.cast.forEach((member) => {
    const nodeId = `person-${member.id}`
    if (!seenIds.has(nodeId)) {
      seenIds.add(nodeId)
      nodes.push({
        id: nodeId,
        entityId: member.id,
        type: 'actor',
        label: member.name,
        sublabel: member.character,
        imagePath: member.profilePath,
        expanded: false,
      })
    }
    edges.push({ source: rootId, target: nodeId, label: member.character })
  })

  credits.crew.forEach((member) => {
    const nodeId = `person-${member.id}`
    const isDirector = member.job === 'Director'
    if (!seenIds.has(nodeId)) {
      seenIds.add(nodeId)
      nodes.push({
        id: nodeId,
        entityId: member.id,
        type: isDirector ? 'director' : 'crew',
        label: member.name,
        sublabel: member.job,
        imagePath: member.profilePath,
        expanded: false,
      })
    }
    edges.push({ source: rootId, target: nodeId, label: member.job })
  })

  return capNodes(nodes, edges, MAX_GRAPH_CHILD_NODES, true)
}

export async function fetchPersonGraph(
  personId: number,
  personName: string,
  profilePath: string | null,
  knownFor: string | null,
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const { data: credits } = await api.get<PersonCredits>(`/person/${personId}/credits`)

  const rootId = `person-${personId}`
  const rootNode: GraphNode = {
    id: rootId,
    entityId: personId,
    type: knownFor === 'Directing' ? 'director' : 'actor',
    label: personName,
    imagePath: profilePath,
    expanded: true,
  }

  const nodes: GraphNode[] = [rootNode]
  const edges: GraphEdge[] = []
  const seenIds = new Set<string>([rootId])

  // All cast credits (movies + TV)
  credits.cast.forEach((credit) => {
    const nodeId = mediaNodeId(credit.mediaType, credit.id)
    if (!seenIds.has(nodeId)) {
      seenIds.add(nodeId)
      nodes.push({
        id: nodeId,
        entityId: credit.id,
        type: credit.mediaType === 'movie' ? 'movie' : 'movie', // TV shows use movie node type visually
        label: credit.title,
        sublabel: credit.releaseDate?.slice(0, 4) || credit.mediaType.toUpperCase(),
        imagePath: credit.posterPath,
        expanded: false,
      })
    }
    edges.push({ source: rootId, target: nodeId, label: credit.character || 'Cast' })
  })

  // All crew credits
  credits.crew.forEach((credit) => {
    const nodeId = mediaNodeId(credit.mediaType, credit.id)
    if (!seenIds.has(nodeId)) {
      seenIds.add(nodeId)
      nodes.push({
        id: nodeId,
        entityId: credit.id,
        type: 'movie',
        label: credit.title,
        sublabel: credit.releaseDate?.slice(0, 4) || credit.mediaType.toUpperCase(),
        imagePath: credit.posterPath,
        expanded: false,
      })
    }
    edges.push({ source: rootId, target: nodeId, label: credit.job || 'Crew' })
  })

  return capNodes(nodes, edges, MAX_GRAPH_CHILD_NODES, true)
}

export async function expandNode(
  node: GraphNode,
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  if (node.type === 'movie') {
    const { data: credits } = await api.get<MovieCredits>(`/movie/${node.entityId}/credits`)
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const seenIds = new Set<string>()

    credits.cast.forEach((member) => {
      const nodeId = `person-${member.id}`
      if (!seenIds.has(nodeId)) {
        seenIds.add(nodeId)
        nodes.push({
          id: nodeId,
          entityId: member.id,
          type: 'actor',
          label: member.name,
          sublabel: member.character,
          imagePath: member.profilePath,
          expanded: false,
        })
      }
      edges.push({ source: node.id, target: nodeId, label: member.character })
    })

    credits.crew.forEach((member) => {
      const nodeId = `person-${member.id}`
      const isDirector = member.job === 'Director'
      if (!seenIds.has(nodeId)) {
        seenIds.add(nodeId)
        nodes.push({
          id: nodeId,
          entityId: member.id,
          type: isDirector ? 'director' : 'crew',
          label: member.name,
          sublabel: member.job,
          imagePath: member.profilePath,
          expanded: false,
        })
      }
      edges.push({ source: node.id, target: nodeId, label: member.job })
    })

    return capNodes(nodes, edges, MAX_GRAPH_CHILD_NODES, false)
  }

  // Person node — expand to show all their credits
  const { data: credits } = await api.get<PersonCredits>(`/person/${node.entityId}/credits`)
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const seenIds = new Set<string>()

  credits.cast.forEach((credit) => {
    const nodeId = mediaNodeId(credit.mediaType, credit.id)
    if (!seenIds.has(nodeId)) {
      seenIds.add(nodeId)
      nodes.push({
        id: nodeId,
        entityId: credit.id,
        type: 'movie',
        label: credit.title,
        sublabel: credit.releaseDate?.slice(0, 4) || credit.mediaType.toUpperCase(),
        imagePath: credit.posterPath,
        expanded: false,
      })
    }
    edges.push({ source: node.id, target: nodeId, label: credit.character || 'Cast' })
  })

  credits.crew.forEach((credit) => {
    const nodeId = mediaNodeId(credit.mediaType, credit.id)
    if (!seenIds.has(nodeId)) {
      seenIds.add(nodeId)
      nodes.push({
        id: nodeId,
        entityId: credit.id,
        type: 'movie',
        label: credit.title,
        sublabel: credit.releaseDate?.slice(0, 4) || credit.mediaType.toUpperCase(),
        imagePath: credit.posterPath,
        expanded: false,
      })
    }
    edges.push({ source: node.id, target: nodeId, label: credit.job || 'Crew' })
  })

  return capNodes(nodes, edges, MAX_GRAPH_CHILD_NODES, false)
}
