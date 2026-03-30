import { Film, User } from 'lucide-react'
import { Poster } from '@/components/shared/Poster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SearchResult } from '@/types/movie.types'

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  onClose: () => void
}

export function SearchResults({ results, isLoading, onClose }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-border/50 bg-popover/95 p-2 shadow-xl backdrop-blur-xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-14 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-border/50 bg-popover/95 p-8 text-center shadow-xl backdrop-blur-xl">
        <p className="text-muted-foreground">No results found</p>
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-border/50 bg-popover/95 shadow-xl backdrop-blur-xl">
      <ScrollArea className="max-h-96 p-2">
        {results.map((result) => (
          <Button
            key={`${result.mediaType}-${result.id}`}
            variant="ghost"
            onClick={onClose}
            className="flex h-auto w-full items-center justify-start gap-3 rounded-lg p-2 text-left"
          >
            <Poster
              path={result.posterPath}
              alt={result.title}
              size="thumbnail"
              type={result.mediaType}
              className="h-14 w-10 shrink-0 rounded-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {result.title}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {result.mediaType === 'movie' ? (
                    <><Film size={12} /> Movie</>
                  ) : (
                    <><User size={12} /> {result.knownForDepartment || 'Person'}</>
                  )}
                </Badge>
                {result.releaseDate && (
                  <span className="text-xs text-muted-foreground">
                    {result.releaseDate.slice(0, 4)}
                  </span>
                )}
                {result.voteAverage != null && result.voteAverage > 0 && (
                  <span className="text-xs text-primary font-medium">
                    ★ {result.voteAverage.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </Button>
        ))}
      </ScrollArea>
    </div>
  )
}
