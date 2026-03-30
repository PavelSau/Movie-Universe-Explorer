import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/useTheme'
import { Header } from '@/components/layout/Header'
import { SearchBar } from '@/components/search/SearchBar'
import { TrendingDashboard } from '@/components/trending/TrendingDashboard'
import { Sparkles } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  useTheme()

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero section with gradient background */}
      <div className="relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-hero-from via-transparent to-hero-to" />
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

        <main className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles size={14} />
              Discover connections in cinema
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Explore the Movie
              <span className="block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Universe
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Search any film or actor and discover connections, timelines, and trends across the world of cinema
            </p>
          </div>

          <div className="mt-10">
            <SearchBar />
          </div>
        </main>
      </div>

      {/* Trending section */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <TrendingDashboard />
      </div>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
