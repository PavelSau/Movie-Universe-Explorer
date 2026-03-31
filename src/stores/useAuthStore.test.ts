import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import { useAuthStore } from './useAuthStore'
import { api } from '@/services/api'

const mockedApi = vi.mocked(api)

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

const mockUser = { id: 1, username: 'john', displayName: 'John Doe' }
const mockToken = 'jwt-test-token-123'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
    })
  })

  describe('initial state', () => {
    it('has null user', () => {
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('has null token when localStorage is empty', () => {
      expect(useAuthStore.getState().token).toBeNull()
    })

    it('is not loading', () => {
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('login', () => {
    it('sets user and token on success', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      })

      await useAuthStore.getState().login('john', 'password123')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe(mockToken)
      expect(state.isLoading).toBe(false)
    })

    it('calls api.post with correct arguments', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      })

      await useAuthStore.getState().login('john', 'password123')

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        username: 'john',
        password: 'password123',
      })
    })

    it('saves token to localStorage', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      })

      await useAuthStore.getState().login('john', 'password123')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', mockToken)
    })

    it('sets isLoading to true during login', async () => {
      let loadingDuringRequest = false
      mockedApi.post.mockImplementationOnce(() => {
        loadingDuringRequest = useAuthStore.getState().isLoading
        return Promise.resolve({ data: { user: mockUser, token: mockToken } })
      })

      await useAuthStore.getState().login('john', 'password123')

      expect(loadingDuringRequest).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('resets isLoading and throws on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Invalid credentials'))

      await expect(
        useAuthStore.getState().login('john', 'wrongpass')
      ).rejects.toThrow('Invalid credentials')

      expect(useAuthStore.getState().isLoading).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('register', () => {
    it('sets user and token on success', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      })

      await useAuthStore.getState().register('john', 'password123', 'John Doe')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe(mockToken)
      expect(state.isLoading).toBe(false)
    })

    it('calls api.post with correct arguments', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      })

      await useAuthStore.getState().register('john', 'password123', 'John Doe')

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
        username: 'john',
        password: 'password123',
        displayName: 'John Doe',
      })
    })

    it('saves token to localStorage', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      })

      await useAuthStore.getState().register('john', 'password123', 'John Doe')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', mockToken)
    })

    it('resets isLoading and throws on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Username taken'))

      await expect(
        useAuthStore.getState().register('john', 'password123', 'John Doe')
      ).rejects.toThrow('Username taken')

      expect(useAuthStore.getState().isLoading).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears user and token', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      })
      await useAuthStore.getState().login('john', 'password123')

      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })

    it('removes token from localStorage', () => {
      useAuthStore.getState().logout()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('restore', () => {
    it('restores user from /auth/me when token exists', async () => {
      localStorageMock.setItem('auth_token', mockToken)
      mockedApi.get.mockResolvedValueOnce({ data: mockUser })

      await useAuthStore.getState().restore()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe(mockToken)
    })

    it('calls api.get with /auth/me', async () => {
      localStorageMock.setItem('auth_token', mockToken)
      mockedApi.get.mockResolvedValueOnce({ data: mockUser })

      await useAuthStore.getState().restore()

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me')
    })

    it('does nothing when no token in localStorage', async () => {
      await useAuthStore.getState().restore()

      expect(mockedApi.get).not.toHaveBeenCalled()
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('clears auth state when /auth/me fails', async () => {
      localStorageMock.setItem('auth_token', mockToken)
      mockedApi.get.mockRejectedValueOnce(new Error('Unauthorized'))

      await useAuthStore.getState().restore()

      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().token).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })
})
