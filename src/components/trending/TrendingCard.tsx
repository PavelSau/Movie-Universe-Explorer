import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Poster } from '@/components/shared/Poster'
import type { TrendingMovie } from '@/types/movie.types'

interface TrendingCardProps {
  movie: TrendingMovie
  rank: number
}

export function TrendingCard({ movie, rank }: TrendingCardProps) {
  return (
    <Card className="group relative p-0 border-border/50 bg-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30">
      <div className="relative aspect-[2/3] overflow-hidden">
        <Poster
          path={movie.posterPath}
          alt={movie.title}
          size="card"
          className="h-full w-full transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-overlay to-transparent" />

        {/* Rank badge */}
        <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-xs shadow-lg shadow-primary/30">
          {rank}
        </div>

        {/* Rating badge */}
        {movie.voteAverage != null && movie.voteAverage > 0 && (
          <Badge className="absolute top-2 right-2 gap-1 bg-overlay text-overlay-foreground backdrop-blur-md border-0 hover:bg-overlay">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {movie.voteAverage.toFixed(1)}
          </Badge>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="truncate font-semibold text-card-foreground">
          {movie.title}
        </h3>
        {movie.releaseDate && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {movie.releaseDate.slice(0, 4)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
