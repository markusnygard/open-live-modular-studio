import { cn } from '@/lib/cn'

type BadgeVariant = 'live' | 'preview' | 'connected' | 'connecting' | 'disconnected' | 'mock' | 'running' | 'error' | 'idle'

interface BadgeProps {
  variant: BadgeVariant
  label?: string
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  live:         'bg-red-900 text-red-200 border border-red-700',
  preview:      'bg-green-900 text-green-200 border border-green-700',
  connected:    'bg-emerald-900 text-emerald-200 border border-emerald-700',
  connecting:   'bg-yellow-900 text-yellow-200 border border-yellow-700',
  disconnected: 'bg-zinc-800 text-zinc-400 border border-zinc-600',
  mock:         'bg-indigo-900 text-indigo-200 border border-indigo-700',
  running:      'bg-emerald-900 text-emerald-200 border border-emerald-700',
  error:        'bg-red-900 text-red-200 border border-red-700',
  idle:         'bg-zinc-800 text-zinc-400 border border-zinc-600',
}

const defaultLabels: Record<BadgeVariant, string> = {
  live: 'LIVE', preview: 'PREVIEW', connected: 'CONNECTED',
  connecting: 'CONNECTING', disconnected: 'OFFLINE', mock: 'MOCK',
  running: 'RUNNING', error: 'ERROR', idle: 'IDLE',
}

export function Badge({ variant, label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider',
        variantClasses[variant],
        className,
      )}
    >
      {label ?? defaultLabels[variant]}
    </span>
  )
}
