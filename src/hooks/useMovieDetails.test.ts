import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createWrapper } from '@/test/utils'
import { useMovieDetails, useMovieCredits } from '@/hooks/useMovieDetails'
import { mockMovieDetail, mockMovieCredits } from '@/test/mocks/handlers'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useMovieDetails', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieDetails(550), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeDefined()
  })

  it('fetches movie details with correct shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieDetails(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(
      expect.objectContaining({
        id: mockMovieDetail.id,
        title: mockMovieDetail.title,
        tagline: mockMovieDetail.tagline,
        overview: mockMovieDetail.overview,
        runtime: mockMovieDetail.runtime,
        voteAverage: mockMovieDetail.voteAverage,
      }),
    )
  })

  it('returns genres for the movie', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieDetails(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.genres).toHaveLength(2)
    expect(result.current.data?.genres[0].name).toBe('Drama')
  })

  it('does not fetch when movieId is 0', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieDetails(0), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when movieId is negative', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieDetails(-1), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('handles API errors for non-existent movie', async () => {
    server.use(
      http.get('http://localhost:3001/api/movie/:id', () => {
        return HttpResponse.json(
          { error: 'Not found', code: 404 },
          { status: 404 },
        )
      }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieDetails(999999), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useMovieCredits', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieCredits(550), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeDefined()
  })

  it('fetches movie credits with cast and crew', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieCredits(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.cast).toHaveLength(mockMovieCredits.cast.length)
    expect(result.current.data?.crew).toHaveLength(mockMovieCredits.crew.length)
    expect(result.current.data?.cast[0].name).toBe('Edward Norton')
    expect(result.current.data?.cast[1].name).toBe('Brad Pitt')
    expect(result.current.data?.crew[0].name).toBe('David Fincher')
  })

  it('returns cast members with expected shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieCredits(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const firstCast = result.current.data?.cast[0]
    expect(firstCast).toHaveProperty('id')
    expect(firstCast).toHaveProperty('name')
    expect(firstCast).toHaveProperty('character')
    expect(firstCast).toHaveProperty('profilePath')
    expect(firstCast).toHaveProperty('order')
  })

  it('returns crew members with expected shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieCredits(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const firstCrew = result.current.data?.crew[0]
    expect(firstCrew).toHaveProperty('id')
    expect(firstCrew).toHaveProperty('name')
    expect(firstCrew).toHaveProperty('job')
    expect(firstCrew).toHaveProperty('department')
  })

  it('does not fetch when movieId is 0', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieCredits(0), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
