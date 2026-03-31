import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore, setQueryClientRef } from '@/stores/useAuthStore'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

const MovieDetailPage = lazy(() =>
  import('@/pages/MovieDetailPage').then((m) => ({ default: m.MovieDetailPage }))
)
const PersonDetailPage = lazy(() =>
  import('@/pages/PersonDetailPage').then((m) => ({ default: m.PersonDetailPage }))
)
const HeatmapPage = lazy(() =>
  import('@/pages/HeatmapPage').then((m) => ({ default: m.HeatmapPage }))
)
const WishlistPage = lazy(() =>
  import('@/pages/WishlistPage').then((m) => ({ default: m.WishlistPage }))
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
setQueryClientRef(queryClient)

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
            element={<ErrorBoundary fallbackTitle="Failed to load movie"><Suspense fallback={<PageSkeleton />}><MovieDetailPage /></Suspense></ErrorBoundary>}
          />
          <Route
            path="/person/:id"
            element={<ErrorBoundary fallbackTitle="Failed to load person"><Suspense fallback={<PageSkeleton />}><PersonDetailPage /></Suspense></ErrorBoundary>}
          />
          <Route
            path="/heatmap"
            element={<ErrorBoundary fallbackTitle="Failed to load heatmap"><Suspense fallback={<PageSkeleton />}><HeatmapPage /></Suspense></ErrorBoundary>}
          />
          <Route
            path="/wishlist"
            element={<ErrorBoundary fallbackTitle="Failed to load wishlist"><Suspense fallback={<PageSkeleton />}><WishlistPage /></Suspense></ErrorBoundary>}
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
