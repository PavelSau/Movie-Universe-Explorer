import { cn } from '@/utils/cn'

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800',
        className,
      )}
    />
  )
}
