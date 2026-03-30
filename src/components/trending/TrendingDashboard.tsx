import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useTrending } from '@/hooks/useTrending'
import { TrendingCard } from '@/components/trending/TrendingCard'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { cn } from '@/utils/cn'

export function TrendingDashboard() {
  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('day')
  const { data, isLoading, error } = useTrending(timeWindow)

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp size={24} className="text-indigo-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending</h2>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
          {(['day', 'week'] as const).map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200',
                timeWindow === w
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              {w === 'day' ? 'Today' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950">
          <p className="text-rose-600 dark:text-rose-400">Failed to load trending movies</p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <LoadingSkeleton className="aspect-[2/3] w-full rounded-xl" />
              <LoadingSkeleton className="h-4 w-3/4" />
              <LoadingSkeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.results.map((movie) => (
            <TrendingCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  )
}
