import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useGenres } from '@/hooks/useGenres'
import type { HeatmapData, DiscoverResponse } from '@/types/heatmap.types'

const DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020]
const DISCOVER_PAGES = 4 // 4 pages × 20 = 80 movies

export function useHeatmapData() {
  const { data: genres, isLoading: genresLoading, error: genresError } = useGenres()

  const heatmapQuery = useQuery({
    queryKey: ['heatmap'],
    queryFn: async (): Promise<HeatmapData> => {
      if (!genres) throw new Error('Genres not loaded')

      // Fetch 4 pages of popular movies (80 total) — only 4 API calls
      const pages = await Promise.all(
        Array.from({ length: DISCOVER_PAGES }, (_, i) =>
          api.get<DiscoverResponse>('/discover', {
            params: {
              sort_by: 'vote_count.desc',
              'vote_count.gte': 100,
              page: i + 1,
            },
          }).then(({ data }) => data.results)
        )
      )

      const movies = pages.flat()
      const genreMap = new Map(genres.map((g) => [g.id, g.name]))

      // Build genre × decade matrix client-side from fetched movies
      const cellMap = new Map<string, { total: number; count: number; movieCount: number }>()

      for (const movie of movies) {
        if (!movie.releaseDate) continue
        const year = parseInt(movie.releaseDate.slice(0, 4), 10)
        if (isNaN(year)) continue
        const decade = Math.floor(year / 10) * 10
        if (!DECADES.includes(decade)) continue

        for (const genreId of movie.genreIds) {
          const key = `${genreId}-${decade}`
          const existing = cellMap.get(key) || { total: 0, count: 0, movieCount: 0 }
          existing.total += movie.voteAverage
          existing.count += 1
          existing.movieCount += 1
          cellMap.set(key, existing)
        }
      }

      const cells = Array.from(cellMap.entries()).map(([key, data]) => {
        const [genreIdStr, decadeStr] = key.split('-')
        const genreId = Number(genreIdStr)
        const decade = Number(decadeStr)
        return {
          genreId,
          genreName: genreMap.get(genreId) || 'Unknown',
          decade,
          avgRating: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
          movieCount: data.movieCount,
        }
      })

      return {
        cells,
        genres,
        decades: DECADES,
      }
    },
    enabled: !!genres && genres.length > 0,
    staleTime: 1000 * 60 * 60,
  })

  return {
    data: heatmapQuery.data,
    isLoading: genresLoading || heatmapQuery.isLoading,
    error: genresError || heatmapQuery.error,
  }
}
