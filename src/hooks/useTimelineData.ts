import { useMemo } from 'react'
import type { PersonCredits } from '@/types/person.types'
import type { TimelineItem } from '@/types/timeline.types'

export function useTimelineData(credits: PersonCredits | undefined): TimelineItem[] {
  return useMemo(() => {
    if (!credits) return []

    const items: TimelineItem[] = credits.cast
      .filter((c) => c.releaseDate && c.releaseDate.length >= 4)
      .map((c) => {
        const date = new Date(c.releaseDate as string)
        return {
          id: c.id,
          title: c.title,
          releaseDate: date,
          year: date.getFullYear(),
          voteAverage: c.voteAverage ?? 0,
          character: c.character ?? null,
          posterPath: c.posterPath,
          mediaType: c.mediaType,
          primaryGenreId: c.genreIds.length > 0 ? c.genreIds[0] : null,
          genreIds: c.genreIds,
        }
      })
      .filter((item) => !isNaN(item.releaseDate.getTime()))
      .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime())

    return items
  }, [credits])
}
