import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, Cake, Briefcase, ChevronDown, ChevronUp } from 'lucide-react'
import { GraphView } from '@/components/graph/GraphView'
import { TimelineView } from '@/components/timeline/TimelineView'
import { GenreRadar } from '@/components/person/GenreRadar'
import { usePersonDetails, usePersonCredits } from '@/hooks/usePersonDetails'
import { Poster } from '@/components/shared/Poster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { PROFILE_SIZES } from '@/utils/constants'
import { formatDate, calculateAge } from '@/utils/formatters'

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const personId = Number(id)
  const { data: person, isLoading, error } = usePersonDetails(personId)
  const { data: credits, isLoading: creditsLoading } = usePersonCredits(personId)
  const [showFullBio, setShowFullBio] = useState(false)

  if (isLoading) return <PersonDetailSkeleton />
  if (error || !person) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-destructive text-lg">Failed to load person details</p>
        <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft size={16} /> Back to Home
        </Button>
      </div>
    )
  }

  const age = calculateAge(person.birthday, person.deathday)
  const bioIsLong = person.biography && person.biography.length > 500

  return (
    <div>
      {/* Gradient header */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-hero-from via-transparent to-hero-to" />
        <div className="pointer-events-none absolute top-0 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <Button variant="secondary" size="sm" className="backdrop-blur-md" onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Back
          </Button>

          <div className="mt-8 flex flex-col items-center gap-8 pb-12 md:flex-row md:items-start">
            {/* Profile photo */}
            {person.profilePath ? (
              <img
                src={`${PROFILE_SIZES.card}${person.profilePath}`}
                alt={person.name}
                className="h-72 w-52 shrink-0 rounded-2xl object-cover shadow-2xl shadow-primary/10 ring-2 ring-border/50 md:h-80 md:w-56"
              />
            ) : (
              <Poster
                path={null}
                alt={person.name}
                type="person"
                className="h-72 w-52 shrink-0 rounded-2xl md:h-80 md:w-56"
              />
            )}

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {person.name}
              </h1>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                {person.knownForDepartment && (
                  <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                    <Briefcase size={14} /> {person.knownForDepartment}
                  </Badge>
                )}
                {person.birthday && (
                  <Badge variant="secondary" className="gap-1">
                    <Cake size={14} /> {formatDate(person.birthday)}
                    {age !== null && ` (${age}${person.deathday ? ', deceased' : ''})`}
                  </Badge>
                )}
                {person.placeOfBirth && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin size={14} /> {person.placeOfBirth}
                  </Badge>
                )}
              </div>

              {/* Biography */}
              {person.biography && (
                <div className="mt-6 max-w-2xl">
                  <p className={`leading-relaxed text-foreground/90 ${!showFullBio && bioIsLong ? 'line-clamp-5' : ''}`}>
                    {person.biography}
                  </p>
                  {bioIsLong && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="mt-2"
                    >
                      {showFullBio ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Graph */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <GraphView
          entityType="person"
          entityId={person.id}
          title={person.name}
          imagePath={person.profilePath}
          knownFor={person.knownForDepartment}
        />
      </div>

      {/* Career Timeline */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TimelineView personId={person.id} />
      </div>

      {/* Genre Radar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <GenreRadar credits={credits} isLoading={creditsLoading} />
      </div>

      {/* Filmography */}
      {credits && credits.cast.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Star size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Filmography</h2>
              <p className="text-sm text-muted-foreground">{credits.cast.length} credits as cast</p>
            </div>
          </div>
          <Separator className="mb-6 bg-border/50" />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {credits.cast.slice(0, 20).map((credit) => (
              <Link
                key={`${credit.id}-${credit.character}`}
                to={credit.mediaType === 'movie' ? `/movie/${credit.id}` : '#'}
                className="cursor-pointer"
              >
                <Card className="group relative p-0 border-border/50 bg-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-t-xl">
                    <Poster
                      path={credit.posterPath}
                      alt={credit.title}
                      size="card"
                      className="h-full w-full transition-transform duration-500 group-hover:scale-110"
                    />
                    {credit.voteAverage != null && credit.voteAverage > 0 && (
                      <Badge className="absolute top-2 right-2 gap-1 bg-overlay text-overlay-foreground backdrop-blur-md border-0 hover:bg-overlay">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {credit.voteAverage.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="truncate font-semibold text-card-foreground">
                      {credit.title}
                    </h3>
                    {credit.character && (
                      <p className="mt-0.5 truncate text-xs text-primary">{credit.character}</p>
                    )}
                    {credit.releaseDate && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{credit.releaseDate.slice(0, 4)}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PersonDetailSkeleton() {
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
          <Skeleton className="h-80 w-56 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
