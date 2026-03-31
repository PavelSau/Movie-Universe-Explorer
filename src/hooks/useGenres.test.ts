import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '@/test/mocks/server'
import { createWrapper } from '@/test/utils'
import { useGenres } from '@/hooks/useGenres'
import { mockGenres } from '@/test/mocks/handlers'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useGenres', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useGenres(), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeDefined()
  })

  it('fetches genres and returns the genres array', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useGenres(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(mockGenres.length)
    expect(result.current.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 28, name: 'Action' }),
        expect.objectContaining({ id: 18, name: 'Drama' }),
        expect.objectContaining({ id: 53, name: 'Thriller' }),
      ]),
    )
  })

  it('returns genres with correct id and name fields', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useGenres(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const firstGenre = result.current.data?.[0]
    expect(firstGenre).toHaveProperty('id')
    expect(firstGenre).toHaveProperty('name')
    expect(typeof firstGenre?.id).toBe('number')
    expect(typeof firstGenre?.name).toBe('string')
  })

  it('includes known genre entries', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useGenres(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const genreNames = result.current.data?.map((g) => g.name) ?? []
    expect(genreNames).toContain('Action')
    expect(genreNames).toContain('Drama')
    expect(genreNames).toContain('Thriller')
  })
})
