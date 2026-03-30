import { useState } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useMovieVideos, type MovieVideo } from '@/hooks/useMovieVideos'

interface MovieTrailerProps {
  movieId: number
  movieTitle: string
}

const MAX_TABS = 5

function sortVideos(videos: MovieVideo[]): MovieVideo[] {
  const trailers = videos.filter((v) => v.type === 'Trailer')
  const teasers = videos.filter((v) => v.type === 'Teaser')
  return [...trailers, ...teasers].slice(0, MAX_TABS)
}

export function MovieTrailer({ movieId, movieTitle }: MovieTrailerProps) {
  const { data: videos } = useMovieVideos(movieId)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  if (!videos || videos.length === 0) return null

  const sorted = sortVideos(videos)
  const current = sorted[activeIdx] || sorted[0]

  return (
    <>
      <Button
        variant="default"
        size="lg"
        className="gap-2 shadow-lg shadow-primary/25"
        onClick={() => {
          setActiveIdx(0)
          setOpen(true)
        }}
      >
        <Play size={18} className="fill-primary-foreground" />
        Watch Trailer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-3xl w-full p-0 gap-0 bg-card/95 backdrop-blur-xl"
        >
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>{movieTitle}</DialogTitle>
            <DialogDescription>{current.name}</DialogDescription>
          </DialogHeader>

          <div className="px-4 pb-4">
            {/* Video container — fixed aspect ratio */}
            <div className="relative aspect-video w-full rounded-lg bg-muted">
              <iframe
                key={current.key}
                src={`https://www.youtube.com/embed/${current.key}?autoplay=1`}
                title={current.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full rounded-lg"
              />
            </div>

            {/* Video selector — max 5, inside dialog */}
            {sorted.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sorted.map((video, idx) => (
                  <Button
                    key={video.key}
                    variant={idx === activeIdx ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveIdx(idx)}
                  >
                    {video.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
