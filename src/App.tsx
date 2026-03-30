import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/useAuthStore'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { Skeleton } from '@/components/ui/skeleton'

const MovieDetailPage = lazy(() =>
  import('@/pages/MovieDetailPage').then((m) => ({ default: m.MovieDetailPage }))
)
const PersonDetailPage = lazy(() =>
  import('@/pages/PersonDetailPage').then((m) => ({ default: m.PersonDetailPage }))
)
const HeatmapPage = lazy(() =>
  import('@/pages/HeatmapPage').then((m) => ({ default: m.HeatmapPage }))
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Skeleton className="h-[40vh] w-full rounded-xl" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

function AppContent() {
  useTheme()
  const restore = useAuthStore((s) => s.restore)
  useEffect(() => { restore() }, [restore])

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/movie/:id"
            element={<Suspense fallback={<PageSkeleton />}><MovieDetailPage /></Suspense>}
          />
          <Route
            path="/person/:id"
            element={<Suspense fallback={<PageSkeleton />}><PersonDetailPage /></Suspense>}
          />
          <Route
            path="/heatmap"
            element={<Suspense fallback={<PageSkeleton />}><HeatmapPage /></Suspense>}
          />
        </Routes>
      </div>
    </BrowserRouter>
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
