import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { mockWishlistItems } from '@/test/mocks/handlers'
import { createWrapper } from '@/test/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWishlist, useIsInWishlist } from './useWishlist'

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ user: null, token: null, isLoading: false })
  localStorage.clear()
})
afterAll(() => server.close())

function authenticateUser() {
  useAuthStore.setState({
    user: { id: 1, username: 'testuser', displayName: 'Test User' },
    token: 'mock-jwt-token',
    isLoading: false,
  })
  localStorage.setItem('auth_token', 'mock-jwt-token')
}

describe('useWishlist', () => {
  it('returns wishlist items when authenticated', async () => {
    authenticateUser()

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWishlist(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockWishlistItems)
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].title).toBe('Fight Club')
    expect(result.current.data?.[0].entityType).toBe('movie')
  })

  it('does not fetch when not authenticated', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWishlist(), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('returns empty list when wishlist is empty', async () => {
    authenticateUser()

    server.use(
      http.get('http://localhost:3001/api/wishlist', () => {
        return HttpResponse.json({ items: [] })
      }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWishlist(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
  })
})

describe('useIsInWishlist', () => {
  it('checks if item is in wishlist when authenticated', async () => {
    authenticateUser()

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useIsInWishlist('movie', 550),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBe(false)
  })

  it('returns true when item is in wishlist', async () => {
    authenticateUser()

    server.use(
      http.get('http://localhost:3001/api/wishlist/check', () => {
        return HttpResponse.json({ inWishlist: true })
      }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useIsInWishlist('movie', 550),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBe(true)
  })

  it('does not fetch when not authenticated', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useIsInWishlist('movie', 550),
      { wrapper: Wrapper },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when entityId is 0', () => {
    authenticateUser()

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useIsInWishlist('movie', 0),
      { wrapper: Wrapper },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
