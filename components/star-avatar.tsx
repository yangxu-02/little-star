'use client'

import { cn } from '@/lib/utils'

interface StarAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  isAnimating?: boolean
}

export function StarAvatar({ size = 'md', isAnimating = false }: StarAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent',
        sizeClasses[size],
        isAnimating && 'animate-pulse'
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn('text-primary-foreground', size === 'sm' ? 'w-5 h-5' : 'w-7 h-7')}
      >
        <path
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
          fill="currentColor"
        />
        <circle cx="12" cy="12" r="2" fill="white" className="animate-pulse" />
      </svg>
      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-primary opacity-50 blur-md',
          isAnimating && 'animate-ping'
        )}
      />
    </div>
  )
}
