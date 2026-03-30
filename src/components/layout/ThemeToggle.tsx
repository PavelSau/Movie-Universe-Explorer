import { Sun, Moon, Monitor } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const themes = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
]

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <ToggleGroup
      value={[theme]}
      onValueChange={(value) => {
        if (value.length > 0) {
          setTheme(value[0] as 'light' | 'dark' | 'system')
        }
      }}
      className="rounded-full border border-border/50 bg-muted/50 p-1"
    >
      {themes.map(({ value, icon: Icon, label }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={`Switch to ${label} theme`}
          className="rounded-full px-2.5 py-1.5 data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-md data-[pressed]:shadow-primary/25"
        >
          <Icon size={14} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
