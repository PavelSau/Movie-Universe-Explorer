import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '@/test/mocks/server'
import { createWrapper } from '@/test/utils'
import { usePersonDetails, usePersonCredits } from '@/hooks/usePersonDetails'
import { mockPersonDetail, mockPersonCredits } from '@/test/mocks/handlers'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('usePersonDetails', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePersonDetails(287), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeDefined()
  })

  it('fetches person details with correct shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePersonDetails(287), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(
      expect.objectContaining({
        id: mockPersonDetail.id,
        name: mockPersonDetail.name,
        biography: mockPersonDetail.biography,
        birthday: mockPersonDetail.birthday,
        placeOfBirth: mockPersonDetail.placeOfBirth,
        knownForDepartment: mockPersonDetail.knownForDepartment,
      }),
    )
  })

  it('does not fetch when personId is 0', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePersonDetails(0), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when personId is negative', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePersonDetails(-5), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})

describe('usePersonCredits', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePersonCredits(287), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeDefined()
  })

  it('fetches person credits with cast and crew', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePersonCredits(287), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.cast).toHaveLength(mockPersonCredits.cast.length)
    expect(result.current.data?.crew).toHaveLength(mockPersonCredits.crew.length)
    expect(result.current.data?.cast[0].title).toBe('Fight Club')
    expect(result.current.data?.crew[0].title).toBe('World War Z')
  })

  it('returns cast items with expected shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePersonCredits(287), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const firstCast = result.current.data?.cast[0]
    expect(firstCast).toHaveProperty('id')
    expect(firstCast).toHaveProperty('title')
    expect(firstCast).toHaveProperty('mediaType')
    expect(firstCast).toHaveProperty('character')
    expect(firstCast).toHaveProperty('posterPath')
    expect(firstCast).toHaveProperty('releaseDate')
    expect(firstCast).toHaveProperty('voteAverage')
    expect(firstCast).toHaveProperty('genreIds')
  })

  it('returns crew items with expected shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePersonCredits(287), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const firstCrew = result.current.data?.crew[0]
    expect(firstCrew).toHaveProperty('id')
    expect(firstCrew).toHaveProperty('title')
    expect(firstCrew).toHaveProperty('mediaType')
    expect(firstCrew).toHaveProperty('job')
    expect(firstCrew).toHaveProperty('department')
  })

  it('does not fetch when personId is 0', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePersonCredits(0), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
