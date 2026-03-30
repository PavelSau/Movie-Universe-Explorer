import { Film, User } from 'lucide-react'
import { POSTER_SIZES } from '@/utils/constants'
import { cn } from '@/utils/cn'

interface PosterProps {
  path: string | null
  alt: string
  size?: keyof typeof POSTER_SIZES
  type?: 'movie' | 'person'
  className?: string
}

export function Poster({ path, alt, size = 'card', type = 'movie', className }: PosterProps) {
  if (!path) {
    const Icon = type === 'person' ? User : Film
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800',
          className,
        )}
      >
        <Icon size={32} className="text-gray-400 dark:text-gray-600" />
      </div>
    )
  }

  return (
    <img
      src={`${POSTER_SIZES[size]}${path}`}
      alt={alt}
      loading="lazy"
      className={cn('object-cover', className)}
    />
  )
}
