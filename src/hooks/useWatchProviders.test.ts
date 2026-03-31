import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createWrapper } from '@/test/utils'
import { useWatchProviders } from '@/hooks/useWatchProviders'
import { mockWatchProviders } from '@/test/mocks/handlers'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useWatchProviders', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWatchProviders(550), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeDefined()
  })

  it('fetches watch providers with stream, rent, buy, and country data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWatchProviders(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveProperty('stream')
    expect(result.current.data).toHaveProperty('rent')
    expect(result.current.data).toHaveProperty('buy')
    expect(result.current.data?.stream).toHaveLength(mockWatchProviders.stream.length)
    expect(result.current.data?.rent).toHaveLength(mockWatchProviders.rent.length)
    expect(result.current.data?.buy).toHaveLength(mockWatchProviders.buy.length)
  })

  it('does not fetch when movieId is 0', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWatchProviders(0), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when movieId is negative', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWatchProviders(-1), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('returns link and available countries', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWatchProviders(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.link).toBe('https://www.themoviedb.org/movie/550/watch')
    expect(result.current.data?.availableCountries).toEqual(['US', 'GB'])
  })

  it('returns provider names correctly', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWatchProviders(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.stream[0].name).toBe('Netflix')
    expect(result.current.data?.rent[0].name).toBe('Apple TV')
  })

  it('handles movies with no providers', async () => {
    server.use(
      http.get('http://localhost:3001/api/providers/:id', () => {
        return HttpResponse.json({
          stream: [],
          rent: [],
          buy: [],
          link: null,
          availableCountries: [],
        })
      }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWatchProviders(999), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.stream).toEqual([])
    expect(result.current.data?.rent).toEqual([])
    expect(result.current.data?.buy).toEqual([])
    expect(result.current.data?.link).toBeNull()
    expect(result.current.data?.availableCountries).toEqual([])
  })
})
