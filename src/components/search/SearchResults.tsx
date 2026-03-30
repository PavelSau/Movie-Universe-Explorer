import { Film, User } from 'lucide-react'
import { Poster } from '@/components/shared/Poster'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import type { SearchResult } from '@/types/movie.types'

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  onClose: () => void
}

export function SearchResults({ results, isLoading, onClose }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <LoadingSkeleton className="h-14 w-10 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton className="h-4 w-3/4" />
              <LoadingSkeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">No results found</p>
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {results.map((result) => (
        <button
          key={`${result.mediaType}-${result.id}`}
          onClick={onClose}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Poster
            path={result.posterPath}
            alt={result.title}
            size="thumbnail"
            type={result.mediaType}
            className="h-14 w-10 shrink-0 rounded"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900 dark:text-white">
              {result.title}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {result.mediaType === 'movie' ? (
                <>
                  <Film size={14} />
                  <span>Movie</span>
                  {result.releaseDate && (
                    <span>· {result.releaseDate.slice(0, 4)}</span>
                  )}
                  {result.voteAverage != null && result.voteAverage > 0 && (
                    <span>· ★ {result.voteAverage.toFixed(1)}</span>
                  )}
                </>
              ) : (
                <>
                  <User size={14} />
                  <span>{result.knownForDepartment || 'Person'}</span>
                </>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
