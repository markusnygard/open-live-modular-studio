import { cn } from '@/lib/cn'

type DotColor = 'green' | 'yellow' | 'red' | 'gray'

interface StatusDotProps {
  color: DotColor
  pulse?: boolean
  className?: string
}

const colorClasses: Record<DotColor, string> = {
  green:  'bg-emerald-500',
  yellow: 'bg-yellow-400',
  red:    'bg-red-500',
  gray:   'bg-zinc-500',
}

export function StatusDot({ color, pulse = false, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full flex-shrink-0',
        colorClasses[color],
        pulse && 'animate-pulse',
        className,
      )}
    />
  )
}
