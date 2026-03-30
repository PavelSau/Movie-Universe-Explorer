import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Poster } from '@/components/shared/Poster'
import type { TrendingPerson } from '@/types/movie.types'

interface TrendingPersonCardProps {
  person: TrendingPerson
  rank: number
}

export function TrendingPersonCard({ person, rank }: TrendingPersonCardProps) {
  return (
    <Link to={`/person/${person.id}`} className="cursor-pointer">
      <Card className="group relative border-border/50 bg-card backdrop-blur-sm p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30">
        <div className="flex flex-col items-center px-4 pt-5 pb-1">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-border/50 transition-colors duration-300 group-hover:border-primary/30">
            <Poster
              path={person.profilePath}
              alt={person.name}
              size="card"
              type="person"
              className="h-full w-full transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-xs shadow-lg shadow-primary/30">
            {rank}
          </div>
        </div>
        <CardContent className="p-3 text-center">
          <h3 className="truncate font-semibold text-card-foreground">
            {person.name}
          </h3>
          {person.knownForDepartment && (
            <Badge
              variant="secondary"
              className="mt-1.5 bg-muted text-muted-foreground"
            >
              {person.knownForDepartment}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
