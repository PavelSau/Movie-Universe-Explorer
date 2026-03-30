import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useDebounce } from '@/hooks/useDebounce'
import { useMovieSearch } from '@/hooks/useMovieSearch'
import { SearchResults } from '@/components/search/SearchResults'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SEARCH_DEBOUNCE_MS } from '@/utils/constants'
import { cn } from '@/lib/utils'

export function SearchBar() {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const debouncedQuery = useDebounce(inputValue, SEARCH_DEBOUNCE_MS)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useMovieSearch(debouncedQuery)

  useEffect(() => {
    setSearchQuery(debouncedQuery)
  }, [debouncedQuery, setSearchQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = () => {
    setInputValue('')
    setIsOpen(false)
  }

  const hasResults = isOpen && data?.results.length

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Glow behind the search bar */}
      <div className={cn(
        'absolute -inset-1 rounded-2xl bg-glow blur-xl transition-opacity duration-300',
        hasResults ? 'opacity-100' : 'opacity-0',
      )} />

      <div
        className={cn(
          'relative flex items-center gap-3 rounded-xl border bg-card px-5 py-3.5',
          'shadow-lg shadow-primary/5 backdrop-blur-sm transition-all duration-200',
          hasResults
            ? 'border-primary/40 shadow-xl shadow-primary/10'
            : 'border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5',
        )}
      >
        <Search size={20} className={cn(
          'shrink-0 transition-colors duration-200',
          hasResults ? 'text-primary' : 'text-muted-foreground'
        )} />
        <Input
          variant="ghost"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search movies, actors, directors..."
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleClear}
            className="shrink-0 rounded-full"
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {isOpen && debouncedQuery.trim().length >= 2 && (
        <SearchResults
          results={data?.results || []}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
