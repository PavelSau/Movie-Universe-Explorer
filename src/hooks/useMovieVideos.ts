import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

export interface MovieVideo {
  id: string
  key: string
  name: string
  type: string
}

interface MovieVideosResponse {
  videos: MovieVideo[]
}

export function useMovieVideos(movieId: number) {
  return useQuery({
    queryKey: ['movie', movieId, 'videos'],
    queryFn: async (): Promise<MovieVideo[]> => {
      const { data } = await api.get<MovieVideosResponse>(`/movie/${movieId}/videos`)
      return data.videos
    },
    enabled: movieId > 0,
    staleTime: 1000 * 60 * 60,
  })
}
