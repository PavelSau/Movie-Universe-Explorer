import { Tv, ShoppingCart, PlayCircle, ExternalLink, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useWatchProviders } from '@/hooks/useWatchProviders'
import { TMDB_IMAGE_BASE } from '@/utils/constants'

interface WatchProvidersProps {
  movieId: number
}

const LOGO_BASE = `${TMDB_IMAGE_BASE}/w92`

interface ProviderSectionProps {
  label: string
  icon: React.ReactNode
  providers: Array<{ id: number; name: string; logoPath: string | null }>
  accentClass: string
}

function ProviderSection({ label, icon, providers, accentClass }: ProviderSectionProps) {
  if (providers.length === 0) return null

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className={`text-sm font-semibold ${accentClass}`}>{label}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {providers.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg bg-background/60 px-3 py-2.5 transition-all duration-200 hover:bg-primary/5"
          >
            {p.logoPath ? (
              <img
                src={`${LOGO_BASE}${p.logoPath}`}
                alt={p.name}
                className="h-8 w-8 shrink-0 rounded-lg shadow-sm"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted font-bold text-xs text-muted-foreground">
                {p.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-foreground">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WatchProviders({ movieId }: WatchProvidersProps) {
  const { data, isLoading } = useWatchProviders(movieId)

  if (isLoading) {
    return (
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Separator className="mb-6 bg-border/50" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const hasProviders = data.stream.length > 0 || data.rent.length > 0 || data.buy.length > 0
  if (!hasProviders) return null

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Tv size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Where to Watch</h2>
            <p className="text-sm text-muted-foreground">
              Available in {data.availableCountries.length} countries · US providers shown
            </p>
          </div>
        </div>
        {data.link && (
          <a href={data.link} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink size={14} /> All options
            </Button>
          </a>
        )}
      </div>

      <Separator className="mb-6 bg-border/50" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProviderSection
          label="Stream"
          icon={<PlayCircle size={16} className="text-primary" />}
          providers={data.stream}
          accentClass="text-primary"
        />
        <ProviderSection
          label="Rent"
          icon={<Tag size={16} className="text-chart-2" />}
          providers={data.rent}
          accentClass="text-chart-2"
        />
        <ProviderSection
          label="Buy"
          icon={<ShoppingCart size={16} className="text-chart-3" />}
          providers={data.buy}
          accentClass="text-chart-3"
        />
      </div>
    </div>
  )
}
