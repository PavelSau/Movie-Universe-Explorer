import { Link } from 'react-router-dom'
import { Film } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/25">
            <Film size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Movie Universe
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
