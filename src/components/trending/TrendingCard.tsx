import { Star } from 'lucide-react'
import { Poster } from '@/components/shared/Poster'
import type { TrendingMovie } from '@/types/movie.types'

interface TrendingCardProps {
  movie: TrendingMovie
}

export function TrendingCard({ movie }: TrendingCardProps) {
  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-500/20 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-500/30">
      <div className="relative aspect-[2/3] overflow-hidden">
        <Poster
          path={movie.posterPath}
          alt={movie.title}
          size="card"
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        {movie.voteAverage != null && movie.voteAverage > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {movie.voteAverage.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate font-semibold text-gray-900 dark:text-white">
          {movie.title}
        </h3>
        {movie.releaseDate && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {movie.releaseDate.slice(0, 4)}
          </p>
        )}
      </div>
    </div>
  )
}
