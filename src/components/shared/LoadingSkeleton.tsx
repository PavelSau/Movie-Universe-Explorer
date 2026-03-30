import { Skeleton } from '@/components/ui/skeleton'

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <Skeleton className={className} />
}
