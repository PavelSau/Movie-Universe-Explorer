import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useDebounce } from '@/hooks/useDebounce'
import { useMovieSearch } from '@/hooks/useMovieSearch'
import { SearchResults } from '@/components/search/SearchResults'
import { SEARCH_DEBOUNCE_MS } from '@/utils/constants'
import { cn } from '@/utils/cn'

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

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border bg-white px-4 py-3',
          'shadow-sm transition-all duration-200',
          'dark:bg-gray-900 dark:border-gray-700',
          isOpen && data?.results.length
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
            : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-600',
        )}
      >
        <Search size={20} className="shrink-0 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search movies, actors, directors..."
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none dark:text-white"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
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
