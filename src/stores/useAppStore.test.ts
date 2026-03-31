import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from './useAppStore'

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

describe('useAppStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    useAppStore.setState({
      searchQuery: '',
      theme: 'system',
    })
  })

  describe('initial state', () => {
    it('has empty search query', () => {
      const { searchQuery } = useAppStore.getState()
      expect(searchQuery).toBe('')
    })

    it('defaults theme to system when localStorage is empty', () => {
      const { theme } = useAppStore.getState()
      expect(theme).toBe('system')
    })
  })

  describe('setSearchQuery', () => {
    it('updates the search query', () => {
      useAppStore.getState().setSearchQuery('Inception')
      expect(useAppStore.getState().searchQuery).toBe('Inception')
    })

    it('can set search query to empty string', () => {
      useAppStore.getState().setSearchQuery('test')
      useAppStore.getState().setSearchQuery('')
      expect(useAppStore.getState().searchQuery).toBe('')
    })

    it('handles special characters in query', () => {
      useAppStore.getState().setSearchQuery('Tom & Jerry: The Movie')
      expect(useAppStore.getState().searchQuery).toBe('Tom & Jerry: The Movie')
    })
  })

  describe('setTheme', () => {
    it('sets theme to dark', () => {
      useAppStore.getState().setTheme('dark')
      expect(useAppStore.getState().theme).toBe('dark')
    })

    it('sets theme to light', () => {
      useAppStore.getState().setTheme('light')
      expect(useAppStore.getState().theme).toBe('light')
    })

    it('sets theme to system', () => {
      useAppStore.getState().setTheme('dark')
      useAppStore.getState().setTheme('system')
      expect(useAppStore.getState().theme).toBe('system')
    })

    it('persists theme to localStorage', () => {
      useAppStore.getState().setTheme('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('persists each theme change to localStorage', () => {
      useAppStore.getState().setTheme('light')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
      useAppStore.getState().setTheme('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    })
  })
})
