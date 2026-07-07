import { cn } from '@/lib/cn'
import type { TallyState } from '@/hooks/useTallyLight'

interface TallyLightProps {
  state: TallyState
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = { sm: 'w-2.5 h-2.5', md: 'w-4 h-4', lg: 'w-6 h-6' }

const stateClasses: Record<TallyState, string> = {
  pgm: 'bg-[--color-pgm] shadow-[0_0_8px_var(--color-pgm)]',
  pvw: 'bg-[--color-pvw] shadow-[0_0_8px_var(--color-pvw)]',
  off: 'bg-[--color-tally-off]',
}

export function TallyLight({ state, size = 'md', className }: TallyLightProps) {
  return (
    <span
      className={cn('inline-block rounded-full flex-shrink-0', sizeClasses[size], stateClasses[state], className)}
      title={state === 'pgm' ? 'Program' : state === 'pvw' ? 'Preview' : 'Off'}
    />
  )
}
