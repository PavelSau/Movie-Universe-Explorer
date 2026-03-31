import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '@/test/mocks/server'
import { createWrapper } from '@/test/utils'
import { useTrending } from '@/hooks/useTrending'
import { mockTrendingMovies } from '@/test/mocks/handlers'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useTrending', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTrending('day'), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeDefined()
  })

  it('fetches trending movies for day time window', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTrending('day'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.results).toHaveLength(mockTrendingMovies.results.length)
    expect(result.current.data?.results[0].title).toBe('Fight Club')
    expect(result.current.data?.results[1].title).toBe('Pulp Fiction')
    expect(result.current.data?.timeWindow).toBe('day')
  })

  it('fetches trending movies for week time window', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTrending('week'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.timeWindow).toBe('week')
    expect(result.current.data?.results).toHaveLength(2)
  })

  it('defaults to day time window when no argument provided', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTrending(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.timeWindow).toBe('day')
  })

  it('returns results with expected movie shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTrending('day'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const firstMovie = result.current.data?.results[0]
    expect(firstMovie).toEqual(
      expect.objectContaining({
        id: 550,
        title: 'Fight Club',
        posterPath: '/poster1.jpg',
        voteAverage: 8.4,
      }),
    )
  })
})
