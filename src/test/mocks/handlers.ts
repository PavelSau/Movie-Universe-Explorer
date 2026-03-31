import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3001/api'

// --- Mock data ---

export const mockMovieDetail = {
  id: 550,
  title: 'Fight Club',
  tagline: 'Mischief. Mayhem. Soap.',
  overview: 'An insomniac office worker and a soap salesman build an underground fight club.',
  posterPath: '/pB8BM7pdSp6B6Ih7QI4S2t0POhQ.jpg',
  backdropPath: '/hZkgoQYus5dXo3H8T7Uef6DNknB.jpg',
  releaseDate: '1999-10-15',
  runtime: 139,
  voteAverage: 8.4,
  voteCount: 26000,
  budget: 63000000,
  revenue: 101200000,
  status: 'Released',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  productionCompanies: [
    { id: 508, name: 'Regency Enterprises', logoPath: '/logo.png' },
  ],
}

export const mockMovieCredits = {
  cast: [
    { id: 819, name: 'Edward Norton', character: 'The Narrator', profilePath: '/profile1.jpg', order: 0 },
    { id: 287, name: 'Brad Pitt', character: 'Tyler Durden', profilePath: '/profile2.jpg', order: 1 },
    { id: 1283, name: 'Helena Bonham Carter', character: 'Marla Singer', profilePath: '/profile3.jpg', order: 2 },
  ],
  crew: [
    { id: 7467, name: 'David Fincher', job: 'Director', department: 'Directing', profilePath: '/crew1.jpg' },
    { id: 7468, name: 'Jim Uhls', job: 'Screenplay', department: 'Writing', profilePath: null },
  ],
}

export const mockMovieVideos = {
  videos: [
    { id: 'abc', key: 'SUXWAEX2jlg', name: 'Official Trailer', type: 'Trailer', site: 'YouTube' },
  ],
}

export const mockSimilarMovies = {
  results: [
    { id: 680, title: 'Pulp Fiction', posterPath: '/poster1.jpg', voteAverage: 8.5, releaseDate: '1994-09-10' },
    { id: 278, title: 'The Shawshank Redemption', posterPath: '/poster2.jpg', voteAverage: 8.7, releaseDate: '1994-09-23' },
  ],
}

export const mockPersonDetail = {
  id: 287,
  name: 'Brad Pitt',
  biography: 'William Bradley Pitt is an American actor and film producer.',
  birthday: '1963-12-18',
  deathday: null,
  placeOfBirth: 'Shawnee, Oklahoma, USA',
  profilePath: '/profile2.jpg',
  knownForDepartment: 'Acting',
  popularity: 50.5,
}

export const mockPersonCredits = {
  cast: [
    {
      id: 550, title: 'Fight Club', mediaType: 'movie', character: 'Tyler Durden',
      posterPath: '/poster1.jpg', releaseDate: '1999-10-15', voteAverage: 8.4,
      popularity: 60, genreIds: [18, 53],
    },
    {
      id: 16869, title: 'Inglourious Basterds', mediaType: 'movie', character: 'Lt. Aldo Raine',
      posterPath: '/poster2.jpg', releaseDate: '2009-08-19', voteAverage: 8.2,
      popularity: 40, genreIds: [18, 28],
    },
    {
      id: 807, title: 'Se7en', mediaType: 'movie', character: 'Detective David Mills',
      posterPath: '/poster3.jpg', releaseDate: '1995-09-22', voteAverage: 8.3,
      popularity: 45, genreIds: [80, 53, 9648],
    },
  ],
  crew: [
    {
      id: 72190, title: 'World War Z', mediaType: 'movie', job: 'Producer',
      department: 'Production', posterPath: '/poster4.jpg', releaseDate: '2013-06-20',
      voteAverage: 6.8, popularity: 30, genreIds: [28, 27],
    },
  ],
}

export const mockTrendingMovies = {
  results: [
    {
      id: 550, title: 'Fight Club', posterPath: '/poster1.jpg', backdropPath: '/bd1.jpg',
      releaseDate: '1999-10-15', overview: 'An insomniac...', voteAverage: 8.4,
      genreIds: [18, 53], popularity: 60,
    },
    {
      id: 680, title: 'Pulp Fiction', posterPath: '/poster2.jpg', backdropPath: '/bd2.jpg',
      releaseDate: '1994-09-10', overview: 'A burger-loving...', voteAverage: 8.5,
      genreIds: [53, 80], popularity: 50,
    },
  ],
  timeWindow: 'day' as const,
}

export const mockSearchResults = {
  results: [
    {
      id: 550, mediaType: 'movie' as const, title: 'Fight Club',
      posterPath: '/poster1.jpg', releaseDate: '1999-10-15',
      overview: 'An insomniac...', voteAverage: 8.4, knownForDepartment: null,
    },
    {
      id: 287, mediaType: 'person' as const, title: 'Brad Pitt',
      posterPath: '/profile2.jpg', releaseDate: null,
      overview: null, voteAverage: null, knownForDepartment: 'Acting',
    },
  ],
  page: 1,
  totalPages: 1,
  totalResults: 2,
}

export const mockGenres = [
  { id: 28, name: 'Action' },
  { id: 18, name: 'Drama' },
  { id: 53, name: 'Thriller' },
  { id: 80, name: 'Crime' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
]

export const mockWatchProviders = {
  stream: [
    { id: 8, name: 'Netflix', logoPath: '/netflix.png' },
  ],
  rent: [
    { id: 2, name: 'Apple TV', logoPath: '/apple.png' },
  ],
  buy: [],
  link: 'https://www.themoviedb.org/movie/550/watch',
  availableCountries: ['US', 'GB'],
}

export const mockWishlistItems = [
  {
    id: 1,
    entityType: 'movie' as const,
    entityId: 550,
    title: 'Fight Club',
    posterPath: '/poster1.jpg',
    createdAt: '2026-01-01T00:00:00Z',
  },
]

// --- Handlers ---

export const handlers = [
  // Search
  http.get(`${BASE}/search`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')
    if (!query) return HttpResponse.json({ error: 'Query parameter is required', code: 400 }, { status: 400 })
    return HttpResponse.json(mockSearchResults)
  }),

  // Trending movies
  http.get(`${BASE}/trending`, ({ request }) => {
    const url = new URL(request.url)
    const window = url.searchParams.get('window') || 'day'
    return HttpResponse.json({ ...mockTrendingMovies, timeWindow: window })
  }),

  // Trending people
  http.get(`${BASE}/trending/people`, () => {
    return HttpResponse.json({ results: [], timeWindow: 'day' })
  }),

  // Movie details
  http.get(`${BASE}/movie/:id`, ({ params }) => {
    if (params.id === '999999') return HttpResponse.json({ error: 'Not found', code: 404 }, { status: 404 })
    return HttpResponse.json(mockMovieDetail)
  }),

  // Movie credits
  http.get(`${BASE}/movie/:id/credits`, () => {
    return HttpResponse.json(mockMovieCredits)
  }),

  // Movie videos
  http.get(`${BASE}/movie/:id/videos`, () => {
    return HttpResponse.json(mockMovieVideos)
  }),

  // Similar movies
  http.get(`${BASE}/movie/:id/similar`, () => {
    return HttpResponse.json(mockSimilarMovies)
  }),

  // Movie recommendations
  http.get(`${BASE}/movie/:id/recommendations`, () => {
    return HttpResponse.json(mockSimilarMovies)
  }),

  // Person details
  http.get(`${BASE}/person/:id`, () => {
    return HttpResponse.json(mockPersonDetail)
  }),

  // Person credits
  http.get(`${BASE}/person/:id/credits`, () => {
    return HttpResponse.json(mockPersonCredits)
  }),

  // Watch providers
  http.get(`${BASE}/providers/:id`, () => {
    return HttpResponse.json(mockWatchProviders)
  }),

  // Genres
  http.get(`${BASE}/genres`, () => {
    return HttpResponse.json({ genres: mockGenres })
  }),

  // Discover
  http.get(`${BASE}/discover`, () => {
    return HttpResponse.json({
      results: [
        {
          id: 550, title: 'Fight Club', posterPath: '/poster1.jpg',
          releaseDate: '1999-10-15', voteAverage: 8.4, genreIds: [18, 53], popularity: 60,
        },
      ],
      totalPages: 1,
      totalResults: 1,
    })
  }),

  // Wishlist
  http.get(`${BASE}/wishlist`, () => {
    return HttpResponse.json({ items: mockWishlistItems })
  }),

  http.get(`${BASE}/wishlist/check`, () => {
    return HttpResponse.json({ inWishlist: false })
  }),

  http.post(`${BASE}/wishlist`, () => {
    return HttpResponse.json({ success: true })
  }),

  http.delete(`${BASE}/wishlist`, () => {
    return HttpResponse.json({ success: true })
  }),

  // Auth
  http.post(`${BASE}/auth/login`, () => {
    return HttpResponse.json({
      user: { id: 1, username: 'testuser', displayName: 'Test User' },
      token: 'mock-jwt-token',
    })
  }),

  http.post(`${BASE}/auth/register`, () => {
    return HttpResponse.json({
      user: { id: 2, username: 'newuser', displayName: 'New User' },
      token: 'mock-jwt-token-2',
    })
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({ id: 1, username: 'testuser', displayName: 'Test User' })
  }),
]
