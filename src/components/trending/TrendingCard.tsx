import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Poster } from '@/components/shared/Poster'
import type { TrendingMovie } from '@/types/movie.types'

interface TrendingCardProps {
  movie: TrendingMovie
}

export function TrendingCard({ movie }: TrendingCardProps) {
  return (
    <Card className="group overflow-hidden p-0 transition-all duration-200 hover:shadow-md hover:ring-primary/20">
      <div className="relative aspect-[2/3] overflow-hidden">
        <Poster
          path={movie.posterPath}
          alt={movie.title}
          size="card"
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        {movie.voteAverage != null && movie.voteAverage > 0 && (
          <Badge className="absolute top-2 right-2 gap-1 bg-overlay text-overlay-foreground backdrop-blur-sm hover:bg-overlay">
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
          <p className="mt-1 text-sm text-muted-foreground">
            {movie.releaseDate.slice(0, 4)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
