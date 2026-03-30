import { api } from '@/services/api'
import type { GraphNode, GraphEdge } from '@/types/graph.types'
import type { MovieCredits } from '@/types/movie.types'
import type { PersonCredits } from '@/types/person.types'

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

  // Add cast (top 12)
  credits.cast.slice(0, 12).forEach((member) => {
    const nodeId = `person-${member.id}`
    if (!nodes.find((n) => n.id === nodeId)) {
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

  // Add key crew
  credits.crew.forEach((member) => {
    const nodeId = `person-${member.id}`
    const isDirector = member.job === 'Director'
    if (!nodes.find((n) => n.id === nodeId)) {
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

  return { nodes, edges }
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

  // Add top movies from cast
  credits.cast.slice(0, 15).forEach((credit) => {
    if (credit.mediaType !== 'movie') return
    const nodeId = `movie-${credit.id}`
    if (!nodes.find((n) => n.id === nodeId)) {
      nodes.push({
        id: nodeId,
        entityId: credit.id,
        type: 'movie',
        label: credit.title,
        sublabel: credit.releaseDate?.slice(0, 4) || undefined,
        imagePath: credit.posterPath,
        expanded: false,
      })
    }
    edges.push({ source: rootId, target: nodeId, label: credit.character || 'Cast' })
  })

  return { nodes, edges }
}

export async function expandNode(
  node: GraphNode,
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  if (node.type === 'movie') {
    const { data: credits } = await api.get<MovieCredits>(`/movie/${node.entityId}/credits`)
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    credits.cast.slice(0, 8).forEach((member) => {
      const nodeId = `person-${member.id}`
      nodes.push({
        id: nodeId,
        entityId: member.id,
        type: 'actor',
        label: member.name,
        sublabel: member.character,
        imagePath: member.profilePath,
        expanded: false,
      })
      edges.push({ source: node.id, target: nodeId, label: member.character })
    })

    credits.crew
      .filter((m) => m.job === 'Director')
      .forEach((member) => {
        const nodeId = `person-${member.id}`
        nodes.push({
          id: nodeId,
          entityId: member.id,
          type: 'director',
          label: member.name,
          sublabel: member.job,
          imagePath: member.profilePath,
          expanded: false,
        })
        edges.push({ source: node.id, target: nodeId, label: member.job })
      })

    return { nodes, edges }
  }

  // Person node — expand to show their movies
  const { data: credits } = await api.get<PersonCredits>(`/person/${node.entityId}/credits`)
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  credits.cast
    .filter((c) => c.mediaType === 'movie')
    .slice(0, 8)
    .forEach((credit) => {
      const nodeId = `movie-${credit.id}`
      nodes.push({
        id: nodeId,
        entityId: credit.id,
        type: 'movie',
        label: credit.title,
        sublabel: credit.releaseDate?.slice(0, 4) || undefined,
        imagePath: credit.posterPath,
        expanded: false,
      })
      edges.push({ source: node.id, target: nodeId, label: credit.character || 'Cast' })
    })

  return { nodes, edges }
}
