import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createWrapper } from '@/test/utils'
import { useSimilarMovies, useRecommendedMovies } from '@/hooks/useSimilarMovies'
import { mockSimilarMovies } from '@/test/mocks/handlers'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useSimilarMovies', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSimilarMovies(550), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeDefined()
  })

  it('fetches similar movies and returns the results array', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSimilarMovies(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(mockSimilarMovies.results.length)
    expect(result.current.data?.[0]).toEqual(
      expect.objectContaining({
        id: 680,
        title: 'Pulp Fiction',
        voteAverage: 8.5,
      }),
    )
    expect(result.current.data?.[1]).toEqual(
      expect.objectContaining({
        id: 278,
        title: 'The Shawshank Redemption',
        voteAverage: 8.7,
      }),
    )
  })

  it('returns SimilarMovie typed data with correct shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSimilarMovies(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const movie = result.current.data?.[0]
    expect(movie).toHaveProperty('id')
    expect(movie).toHaveProperty('title')
    expect(movie).toHaveProperty('posterPath')
    expect(movie).toHaveProperty('voteAverage')
    expect(movie).toHaveProperty('releaseDate')
  })

  it('returns empty results when no similar movies exist', async () => {
    server.use(
      http.get('http://localhost:3001/api/movie/:id/similar', () => {
        return HttpResponse.json({ results: [] })
      }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSimilarMovies(999), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('does not fetch when movieId is 0', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSimilarMovies(0), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})

describe('useRecommendedMovies', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRecommendedMovies(550), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeDefined()
  })

  it('fetches recommended movies and returns the results array', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRecommendedMovies(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(mockSimilarMovies.results.length)
    expect(result.current.data?.[0].title).toBe('Pulp Fiction')
  })

  it('does not fetch when movieId is 0', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRecommendedMovies(0), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when movieId is negative', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRecommendedMovies(-1), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
