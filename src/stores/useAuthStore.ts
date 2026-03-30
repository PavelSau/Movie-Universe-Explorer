import { create } from 'zustand'
import { QueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

let queryClientRef: QueryClient | null = null
export function setQueryClientRef(qc: QueryClient) { queryClientRef = qc }

interface User {
  id: number
  username: string
  displayName: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean

  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  restore: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('auth_token', data.token)
      queryClientRef?.removeQueries({ queryKey: ['wishlist'] })
      set({ user: data.user, token: data.token, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  register: async (username, password, displayName) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/register', { username, password, displayName })
      localStorage.setItem('auth_token', data.token)
      queryClientRef?.removeQueries({ queryKey: ['wishlist'] })
      set({ user: data.user, token: data.token, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    queryClientRef?.removeQueries({ queryKey: ['wishlist'] })
    set({ user: null, token: null })
  },

  restore: async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    try {
      const { data } = await api.get('/auth/me')
      set({ user: data, token })
    } catch {
      localStorage.removeItem('auth_token')
      set({ user: null, token: null })
    }
  },
}))

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isLoading = useAuthStore((s) => s.isLoading)
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const logout = useAuthStore((s) => s.logout)
  const restore = useAuthStore((s) => s.restore)

  return {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    restore,
  }
}
