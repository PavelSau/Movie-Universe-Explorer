import { useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'

export function useTheme() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (resolved: 'light' | 'dark') => {
      root.classList.toggle('dark', resolved === 'dark')
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches ? 'dark' : 'light')

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    applyTheme(theme)
  }, [theme])
}
