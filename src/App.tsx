import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTheme } from '@/hooks/useTheme'
import { Header } from '@/components/layout/Header'
import { SearchBar } from '@/components/search/SearchBar'
import { TrendingDashboard } from '@/components/trending/TrendingDashboard'

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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Explore the Movie Universe
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500 dark:text-gray-400">
            Search any film or actor and discover connections, timelines, and trends
          </p>
        </div>

        <div className="mt-8">
          <SearchBar />
        </div>

        <TrendingDashboard />
      </main>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
