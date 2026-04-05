import { cn } from '@/lib/utils/cn'
import type { Platform } from '@/types/common.types'

interface PlatformBadgeProps {
  platform: Platform | string
  size?: 'sm' | 'md'
}

export function PlatformBadge({ platform, size = 'sm' }: PlatformBadgeProps) {
  const isGoogle = platform === 'google'
  const isMeta = platform === 'meta'

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  if (isMeta) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-semibold',
          'bg-[#1877F2]/15 text-[#1877F2]',
          sizeClass
        )}
      >
        Meta
      </span>
    )
  }

  if (isGoogle) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-semibold',
          'bg-[#34A853]/15 text-[#34A853]',
          sizeClass
        )}
      >
        Google
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        'bg-[#94A3B8]/15 text-[#94A3B8]',
        sizeClass
      )}
    >
      {String(platform)}
    </span>
  )
}
