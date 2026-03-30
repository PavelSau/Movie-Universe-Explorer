import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface AppState {
  searchQuery: string
  theme: Theme
  setSearchQuery: (query: string) => void
  setTheme: (theme: Theme) => void
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('theme') as Theme) || 'system'
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: '',
  theme: getInitialTheme(),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    set({ theme })
  },
}))
