import { Film } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Film size={20} />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Movie Universe
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
