import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { mockSearchResults } from '@/test/mocks/handlers'
import { createWrapper } from '@/test/utils'
import { useMovieSearch } from './useMovieSearch'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useMovieSearch', () => {
  it('returns no data when query is empty', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieSearch(''), { wrapper: Wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('does not fetch when query is less than 2 characters', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieSearch('a'), { wrapper: Wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns search results for a valid query', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieSearch('Fight Club'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockSearchResults)
    expect(result.current.data?.results).toHaveLength(2)
    expect(result.current.data?.results[0].title).toBe('Fight Club')
    expect(result.current.data?.results[1].title).toBe('Brad Pitt')
  })

  it('returns typed SearchResponse data with correct shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieSearch('Fight'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const data = result.current.data
    expect(data).toBeDefined()
    expect(data?.page).toBe(1)
    expect(data?.totalPages).toBe(1)
    expect(data?.totalResults).toBe(2)
    expect(data?.results[0]).toHaveProperty('id')
    expect(data?.results[0]).toHaveProperty('mediaType')
    expect(data?.results[0]).toHaveProperty('title')
  })

  it('handles API errors gracefully', async () => {
    server.use(
      http.get('http://localhost:3001/api/search', () => {
        return HttpResponse.json(
          { error: 'Internal server error', code: 500 },
          { status: 500 },
        )
      }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieSearch('Fight Club'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
