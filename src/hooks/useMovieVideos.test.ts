import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createWrapper } from '@/test/utils'
import { useMovieVideos } from '@/hooks/useMovieVideos'
import { mockMovieVideos } from '@/test/mocks/handlers'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useMovieVideos', () => {
  it('starts in loading state then resolves with data', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieVideos(550), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeDefined()
  })

  it('fetches movie videos and returns the videos array', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieVideos(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(mockMovieVideos.videos.length)
    expect(result.current.data?.[0]).toEqual(
      expect.objectContaining({
        id: 'abc',
        key: 'SUXWAEX2jlg',
        name: 'Official Trailer',
        type: 'Trailer',
      }),
    )
  })

  it('does not fetch when movieId is 0', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieVideos(0), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when movieId is negative', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieVideos(-1), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('returns empty array when no videos exist', async () => {
    server.use(
      http.get('http://localhost:3001/api/movie/:id/videos', () => {
        return HttpResponse.json({ videos: [] })
      }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieVideos(999), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
    expect(result.current.data).toHaveLength(0)
  })

  it('returns videos with MovieVideo shape', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMovieVideos(550), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const video = result.current.data?.[0]
    expect(video).toHaveProperty('id')
    expect(video).toHaveProperty('key')
    expect(video).toHaveProperty('name')
    expect(video).toHaveProperty('type')
  })
})
