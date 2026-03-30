import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, Clock, Calendar, DollarSign, Users } from 'lucide-react'
import { GraphView } from '@/components/graph/GraphView'
import { WatchProviders } from '@/components/movie/WatchProviders'
import { SimilarOrbit } from '@/components/movie/SimilarOrbit'
import { MovieTrailer } from '@/components/movie/MovieTrailer'
import { useMovieDetails, useMovieCredits } from '@/hooks/useMovieDetails'
import { Poster } from '@/components/shared/Poster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { BACKDROP_SIZES, PROFILE_SIZES } from '@/utils/constants'
import { formatRuntime, formatCurrency, formatDate } from '@/utils/formatters'

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const movieId = Number(id)
  const { data: movie, isLoading, error } = useMovieDetails(movieId)
  const { data: credits } = useMovieCredits(movieId)

  if (isLoading) return <MovieDetailSkeleton />
  if (error || !movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-destructive text-lg">Failed to load movie details</p>
        <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft size={16} /> Back to Home
        </Button>
      </div>
    )
  }

  const directors = credits?.crew.filter((c) => c.job === 'Director') || []
  const writers = credits?.crew.filter((c) => c.job === 'Writer' || c.job === 'Screenplay') || []

  return (
    <div>
      {/* Backdrop hero */}
      <div className="relative h-[50vh] min-h-80">
        {movie.backdropPath ? (
          <img
            src={`${BACKDROP_SIZES.large}${movie.backdropPath}`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

        {/* Back button */}
        <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <Button variant="secondary" size="sm" className="backdrop-blur-md" onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Back
          </Button>
        </div>
      </div>

      {/* Main content overlapping backdrop */}
      <div className="relative mx-auto -mt-40 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Poster */}
          <div className="shrink-0">
            <Poster
              path={movie.posterPath}
              alt={movie.title}
              size="card"
              className="w-48 rounded-xl shadow-2xl shadow-primary/10 md:w-64"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="mt-1 text-lg text-muted-foreground italic">"{movie.tagline}"</p>
            )}

            {/* Meta badges */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {movie.voteAverage > 0 && (
                <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                  <Star size={14} className="fill-primary" /> {movie.voteAverage.toFixed(1)}
                  <span className="text-muted-foreground ml-1">/ 10</span>
                </Badge>
              )}
              {movie.runtime && (
                <Badge variant="secondary" className="gap-1">
                  <Clock size={14} /> {formatRuntime(movie.runtime)}
                </Badge>
              )}
              {movie.releaseDate && (
                <Badge variant="secondary" className="gap-1">
                  <Calendar size={14} /> {movie.releaseDate.slice(0, 4)}
                </Badge>
              )}
              <MovieTrailer movieId={movie.id} movieTitle={movie.title} />
            </div>

            {/* Genres */}
            <div className="mt-4 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <Badge key={genre.id} variant="outline">
                  {genre.name}
                </Badge>
              ))}
            </div>

            {/* Overview */}
            {movie.overview && (
              <p className="mt-6 max-w-2xl leading-relaxed text-foreground/90">
                {movie.overview}
              </p>
            )}

            {/* Directors & Writers */}
            {(directors.length > 0 || writers.length > 0) && (
              <div className="mt-6 flex flex-wrap gap-6">
                {directors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Director</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {directors.map((d) => (
                        <Link key={d.id} to={`/person/${d.id}`} className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                          {d.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {writers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Writers</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {writers.map((w) => (
                        <Link key={`${w.id}-${w.job}`} to={`/person/${w.id}`} className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                          {w.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Financials */}
            {(movie.budget > 0 || movie.revenue > 0) && (
              <div className="mt-6 flex flex-wrap gap-6">
                {movie.budget > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Budget</p>
                    <p className="mt-1 flex items-center gap-1 font-semibold text-foreground">
                      <DollarSign size={16} className="text-primary" /> {formatCurrency(movie.budget)}
                    </p>
                  </div>
                )}
                {movie.revenue > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                    <p className="mt-1 flex items-center gap-1 font-semibold text-foreground">
                      <DollarSign size={16} className="text-primary" /> {formatCurrency(movie.revenue)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cast section */}
        {credits && credits.cast.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Users size={20} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Cast</h2>
            </div>
            <Separator className="mb-6 bg-border/50" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {credits.cast.slice(0, 18).map((member) => (
                <Link
                  key={member.id}
                  to={`/person/${member.id}`}
                  className="group cursor-pointer rounded-xl p-3 transition-all duration-200 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
                >
                  {member.profilePath ? (
                    <img
                      src={`${PROFILE_SIZES.thumbnail}${member.profilePath}`}
                      alt={member.name}
                      loading="lazy"
                      className="mx-auto h-28 w-28 rounded-full object-cover ring-2 ring-border/50 transition-all duration-300 group-hover:ring-primary/30"
                    />
                  ) : (
                    <Poster
                      path={null}
                      alt={member.name}
                      type="person"
                      className="mx-auto h-28 w-28 rounded-full"
                    />
                  )}
                  <p className="mt-3 truncate text-center text-sm font-semibold text-foreground">
                    {member.name}
                  </p>
                  <p className="truncate text-center text-xs text-muted-foreground">
                    {member.character}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Where to Watch */}
        <WatchProviders movieId={movie.id} />

        {/* Similar Movies Orbit */}
        <SimilarOrbit
          movieId={movie.id}
          movieTitle={movie.title}
          moviePosterPath={movie.posterPath}
        />

        {/* Connection Graph */}
        <GraphView
          entityType="movie"
          entityId={movie.id}
          title={movie.title}
          imagePath={movie.posterPath}
        />

        {/* Release info */}
        {movie.releaseDate && (
          <div className="mt-12 pb-16">
            <p className="text-sm text-muted-foreground">
              Released {formatDate(movie.releaseDate)} · {movie.status}
              {movie.voteCount > 0 && ` · ${movie.voteCount.toLocaleString()} votes`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MovieDetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-[50vh] min-h-80 w-full rounded-none" />
      <div className="relative mx-auto -mt-40 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <Skeleton className="h-96 w-48 shrink-0 rounded-xl md:w-64" />
          <div className="flex-1 space-y-4 pt-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
