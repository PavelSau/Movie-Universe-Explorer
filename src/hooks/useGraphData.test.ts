import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchMovieGraph, fetchPersonGraph, expandNode } from '@/hooks/useGraphData'
import { api } from '@/services/api'
import type { MovieCredits } from '@/types/movie.types'
import type { PersonCredits } from '@/types/person.types'
import type { GraphNode } from '@/types/graph.types'

vi.mock('@/services/api', () => ({
  api: { get: vi.fn() },
}))

vi.mock('@/utils/constants', () => ({
  MAX_GRAPH_CHILD_NODES: 50,
}))

const mockedApi = vi.mocked(api)

function makeMovieCredits(overrides?: Partial<MovieCredits>): MovieCredits {
  return {
    cast: [
      { id: 1, name: 'Actor One', character: 'Hero', profilePath: '/a1.jpg', order: 0 },
      { id: 2, name: 'Actor Two', character: 'Villain', profilePath: '/a2.jpg', order: 1 },
    ],
    crew: [
      { id: 3, name: 'Director One', job: 'Director', department: 'Directing', profilePath: '/d1.jpg' },
      { id: 4, name: 'Writer One', job: 'Screenplay', department: 'Writing', profilePath: '/w1.jpg' },
    ],
    ...overrides,
  }
}

function makePersonCredits(overrides?: Partial<PersonCredits>): PersonCredits {
  return {
    cast: [
      {
        id: 100,
        title: 'Movie A',
        mediaType: 'movie',
        character: 'Lead',
        job: null,
        department: null,
        posterPath: '/m100.jpg',
        releaseDate: '2020-06-15',
        voteAverage: 7.5,
        popularity: 50,
        genreIds: [28, 12],
      },
      {
        id: 200,
        title: 'TV Show B',
        mediaType: 'tv',
        character: 'Guest',
        job: null,
        department: null,
        posterPath: '/tv200.jpg',
        releaseDate: '2021-01-10',
        voteAverage: 8.0,
        popularity: 40,
        genreIds: [18],
      },
    ],
    crew: [
      {
        id: 300,
        title: 'Movie C',
        mediaType: 'movie',
        character: null,
        job: 'Producer',
        department: 'Production',
        posterPath: '/m300.jpg',
        releaseDate: '2019-03-22',
        voteAverage: 6.0,
        popularity: 30,
        genreIds: [35],
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchMovieGraph', () => {
  it('creates root node as movie type with correct id', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makeMovieCredits() })

    const result = await fetchMovieGraph(42, 'Inception', '/inception.jpg')

    const root = result.nodes[0]
    expect(root.id).toBe('movie-42')
    expect(root.entityId).toBe(42)
    expect(root.type).toBe('movie')
    expect(root.label).toBe('Inception')
    expect(root.imagePath).toBe('/inception.jpg')
    expect(root.expanded).toBe(true)
  })

  it('creates actor nodes for cast with id person-{id}', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makeMovieCredits() })

    const result = await fetchMovieGraph(42, 'Inception', '/inception.jpg')

    const actorNode = result.nodes.find((n) => n.id === 'person-1')
    expect(actorNode).toBeDefined()
    expect(actorNode!.type).toBe('actor')
    expect(actorNode!.label).toBe('Actor One')
    expect(actorNode!.sublabel).toBe('Hero')
    expect(actorNode!.imagePath).toBe('/a1.jpg')
    expect(actorNode!.expanded).toBe(false)

    const actorNode2 = result.nodes.find((n) => n.id === 'person-2')
    expect(actorNode2).toBeDefined()
    expect(actorNode2!.type).toBe('actor')
  })

  it('creates crew nodes with director type for Directors and crew type for others', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makeMovieCredits() })

    const result = await fetchMovieGraph(42, 'Inception', null)

    const directorNode = result.nodes.find((n) => n.id === 'person-3')
    expect(directorNode).toBeDefined()
    expect(directorNode!.type).toBe('director')
    expect(directorNode!.sublabel).toBe('Director')

    const writerNode = result.nodes.find((n) => n.id === 'person-4')
    expect(writerNode).toBeDefined()
    expect(writerNode!.type).toBe('crew')
    expect(writerNode!.sublabel).toBe('Screenplay')
  })

  it('creates edges from root to each person', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makeMovieCredits() })

    const result = await fetchMovieGraph(42, 'Inception', null)

    expect(result.edges).toHaveLength(4)
    result.edges.forEach((edge) => {
      expect(edge.source).toBe('movie-42')
      expect(edge.target).toMatch(/^person-/)
    })

    expect(result.edges[0].label).toBe('Hero')
    expect(result.edges[1].label).toBe('Villain')
    expect(result.edges[2].label).toBe('Director')
    expect(result.edges[3].label).toBe('Screenplay')
  })

  it('deduplicates nodes when same person is in cast and crew', async () => {
    const credits: MovieCredits = {
      cast: [
        { id: 10, name: 'Multi Talent', character: 'Hero', profilePath: '/mt.jpg', order: 0 },
      ],
      crew: [
        { id: 10, name: 'Multi Talent', job: 'Director', department: 'Directing', profilePath: '/mt.jpg' },
      ],
    }
    mockedApi.get.mockResolvedValueOnce({ data: credits })

    const result = await fetchMovieGraph(1, 'Film', null)

    const personNodes = result.nodes.filter((n) => n.id === 'person-10')
    expect(personNodes).toHaveLength(1)
    // The first occurrence (from cast) should be kept as 'actor' type
    expect(personNodes[0].type).toBe('actor')

    // But both edges should exist
    const edgesForPerson = result.edges.filter((e) => e.target === 'person-10')
    expect(edgesForPerson).toHaveLength(2)
    expect(edgesForPerson[0].label).toBe('Hero')
    expect(edgesForPerson[1].label).toBe('Director')
  })

  it('calls the correct API endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makeMovieCredits() })

    await fetchMovieGraph(42, 'Inception', null)

    expect(mockedApi.get).toHaveBeenCalledWith('/movie/42/credits')
  })
})

describe('fetchPersonGraph', () => {
  it('creates root node as director type when knownFor is Directing', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    const result = await fetchPersonGraph(99, 'Nolan', '/nolan.jpg', 'Directing')

    const root = result.nodes[0]
    expect(root.id).toBe('person-99')
    expect(root.entityId).toBe(99)
    expect(root.type).toBe('director')
    expect(root.label).toBe('Nolan')
    expect(root.imagePath).toBe('/nolan.jpg')
    expect(root.expanded).toBe(true)
  })

  it('creates root node as actor type when knownFor is not Directing', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    const result = await fetchPersonGraph(99, 'Actor', '/actor.jpg', 'Acting')

    expect(result.nodes[0].type).toBe('actor')
  })

  it('creates root node as actor type when knownFor is null', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    const result = await fetchPersonGraph(99, 'Unknown', null, null)

    expect(result.nodes[0].type).toBe('actor')
  })

  it('creates movie nodes for cast credits with movie-{id} for movies', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    const result = await fetchPersonGraph(99, 'Actor', null, 'Acting')

    const movieNode = result.nodes.find((n) => n.id === 'movie-100')
    expect(movieNode).toBeDefined()
    expect(movieNode!.type).toBe('movie')
    expect(movieNode!.label).toBe('Movie A')
    expect(movieNode!.sublabel).toBe('2020')
    expect(movieNode!.imagePath).toBe('/m100.jpg')
    expect(movieNode!.expanded).toBe(false)
  })

  it('creates tv nodes for cast credits with tv-{id} for TV shows', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    const result = await fetchPersonGraph(99, 'Actor', null, 'Acting')

    const tvNode = result.nodes.find((n) => n.id === 'tv-200')
    expect(tvNode).toBeDefined()
    expect(tvNode!.type).toBe('movie')
    expect(tvNode!.label).toBe('TV Show B')
    expect(tvNode!.sublabel).toBe('2021')
  })

  it('creates movie nodes for crew credits', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    const result = await fetchPersonGraph(99, 'Actor', null, 'Acting')

    const crewMovie = result.nodes.find((n) => n.id === 'movie-300')
    expect(crewMovie).toBeDefined()
    expect(crewMovie!.label).toBe('Movie C')
    expect(crewMovie!.sublabel).toBe('2019')
  })

  it('creates edges with character label for cast and job label for crew', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    const result = await fetchPersonGraph(99, 'Actor', null, 'Acting')

    const castEdge = result.edges.find((e) => e.target === 'movie-100')
    expect(castEdge).toBeDefined()
    expect(castEdge!.source).toBe('person-99')
    expect(castEdge!.label).toBe('Lead')

    const crewEdge = result.edges.find((e) => e.target === 'movie-300')
    expect(crewEdge).toBeDefined()
    expect(crewEdge!.label).toBe('Producer')
  })

  it('uses mediaType.toUpperCase() as sublabel when releaseDate is missing', async () => {
    const credits: PersonCredits = {
      cast: [
        {
          id: 500,
          title: 'No Date Film',
          mediaType: 'movie',
          character: 'Lead',
          job: null,
          department: null,
          posterPath: null,
          releaseDate: null,
          voteAverage: 5.0,
          popularity: 10,
          genreIds: [],
        },
      ],
      crew: [],
    }
    mockedApi.get.mockResolvedValueOnce({ data: credits })

    const result = await fetchPersonGraph(99, 'Actor', null, 'Acting')

    const noDateNode = result.nodes.find((n) => n.id === 'movie-500')
    expect(noDateNode!.sublabel).toBe('MOVIE')
  })

  it('uses "Cast" as edge label when character is null', async () => {
    const credits: PersonCredits = {
      cast: [
        {
          id: 600,
          title: 'Some Film',
          mediaType: 'movie',
          character: null,
          job: null,
          department: null,
          posterPath: null,
          releaseDate: '2022-01-01',
          voteAverage: 5.0,
          popularity: 10,
          genreIds: [],
        },
      ],
      crew: [],
    }
    mockedApi.get.mockResolvedValueOnce({ data: credits })

    const result = await fetchPersonGraph(99, 'Actor', null, 'Acting')

    const edge = result.edges.find((e) => e.target === 'movie-600')
    expect(edge!.label).toBe('Cast')
  })

  it('calls the correct API endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    await fetchPersonGraph(99, 'Actor', null, 'Acting')

    expect(mockedApi.get).toHaveBeenCalledWith('/person/99/credits')
  })
})

describe('expandNode', () => {
  it('expands a movie node by fetching movie credits', async () => {
    const movieNode: GraphNode = {
      id: 'movie-42',
      entityId: 42,
      type: 'movie',
      label: 'Inception',
      imagePath: null,
      expanded: false,
    }
    mockedApi.get.mockResolvedValueOnce({ data: makeMovieCredits() })

    const result = await expandNode(movieNode)

    expect(mockedApi.get).toHaveBeenCalledWith('/movie/42/credits')

    // No root node — only child nodes
    const hasRoot = result.nodes.some((n) => n.id === 'movie-42')
    expect(hasRoot).toBe(false)

    // Should have cast and crew nodes
    expect(result.nodes.find((n) => n.id === 'person-1')).toBeDefined()
    expect(result.nodes.find((n) => n.id === 'person-2')).toBeDefined()
    expect(result.nodes.find((n) => n.id === 'person-3')).toBeDefined()
    expect(result.nodes.find((n) => n.id === 'person-4')).toBeDefined()
  })

  it('returns edges sourced from the expanded node id', async () => {
    const movieNode: GraphNode = {
      id: 'movie-42',
      entityId: 42,
      type: 'movie',
      label: 'Inception',
      imagePath: null,
      expanded: false,
    }
    mockedApi.get.mockResolvedValueOnce({ data: makeMovieCredits() })

    const result = await expandNode(movieNode)

    result.edges.forEach((edge) => {
      expect(edge.source).toBe('movie-42')
    })
    expect(result.edges).toHaveLength(4)
  })

  it('expands a person/actor node by fetching person credits', async () => {
    const personNode: GraphNode = {
      id: 'person-99',
      entityId: 99,
      type: 'actor',
      label: 'Actor',
      imagePath: null,
      expanded: false,
    }
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    const result = await expandNode(personNode)

    expect(mockedApi.get).toHaveBeenCalledWith('/person/99/credits')

    // No root node — only credit nodes
    const hasRoot = result.nodes.some((n) => n.id === 'person-99')
    expect(hasRoot).toBe(false)

    expect(result.nodes.find((n) => n.id === 'movie-100')).toBeDefined()
    expect(result.nodes.find((n) => n.id === 'tv-200')).toBeDefined()
    expect(result.nodes.find((n) => n.id === 'movie-300')).toBeDefined()
  })

  it('returns edges sourced from the expanded person node id', async () => {
    const personNode: GraphNode = {
      id: 'person-99',
      entityId: 99,
      type: 'actor',
      label: 'Actor',
      imagePath: null,
      expanded: false,
    }
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits() })

    const result = await expandNode(personNode)

    result.edges.forEach((edge) => {
      expect(edge.source).toBe('person-99')
    })
    // 2 cast edges + 1 crew edge = 3
    expect(result.edges).toHaveLength(3)
  })

  it('expanding a director node also fetches person credits', async () => {
    const directorNode: GraphNode = {
      id: 'person-50',
      entityId: 50,
      type: 'director',
      label: 'Director',
      imagePath: null,
      expanded: false,
    }
    mockedApi.get.mockResolvedValueOnce({ data: makePersonCredits({ crew: [] }) })

    const result = await expandNode(directorNode)

    expect(mockedApi.get).toHaveBeenCalledWith('/person/50/credits')
    // Should get cast credits as movie nodes
    expect(result.nodes.find((n) => n.id === 'movie-100')).toBeDefined()
  })

  it('deduplicates nodes when same credit appears in cast and crew', async () => {
    const credits: PersonCredits = {
      cast: [
        {
          id: 700,
          title: 'Dual Role Film',
          mediaType: 'movie',
          character: 'Lead',
          job: null,
          department: null,
          posterPath: null,
          releaseDate: '2020-01-01',
          voteAverage: 7.0,
          popularity: 40,
          genreIds: [],
        },
      ],
      crew: [
        {
          id: 700,
          title: 'Dual Role Film',
          mediaType: 'movie',
          character: null,
          job: 'Producer',
          department: 'Production',
          posterPath: null,
          releaseDate: '2020-01-01',
          voteAverage: 7.0,
          popularity: 40,
          genreIds: [],
        },
      ],
    }
    const personNode: GraphNode = {
      id: 'person-99',
      entityId: 99,
      type: 'actor',
      label: 'Actor',
      imagePath: null,
      expanded: false,
    }
    mockedApi.get.mockResolvedValueOnce({ data: credits })

    const result = await expandNode(personNode)

    const movieNodes = result.nodes.filter((n) => n.id === 'movie-700')
    expect(movieNodes).toHaveLength(1)

    // Both edges should exist
    const edgesForMovie = result.edges.filter((e) => e.target === 'movie-700')
    expect(edgesForMovie).toHaveLength(2)
    expect(edgesForMovie[0].label).toBe('Lead')
    expect(edgesForMovie[1].label).toBe('Producer')
  })
})
