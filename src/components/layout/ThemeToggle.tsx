import { Sun, Moon, Monitor } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/utils/cn'

const themes = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
]

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={`Switch to ${label} theme`}
          className={cn(
            'rounded-full p-2 transition-colors duration-200',
            theme === value
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}
