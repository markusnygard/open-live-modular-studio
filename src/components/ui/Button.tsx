import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'primary' | 'pgm' | 'pvw' | 'ghost' | 'danger' | 'active'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<Variant, string> = {
  default:  'bg-[--color-surface-raised] hover:brightness-110 border border-[--color-border-strong] text-[--color-text-primary]',
  primary:  'bg-[--color-accent] hover:bg-[--color-accent-hover] border-0 text-[--color-text-dark] font-bold shadow-[0_2px_4px_rgba(81,41,10,0.2)] active:translate-y-px',
  active:   'bg-transparent border border-orange-500 text-orange-500 hover:bg-orange-500/10 font-bold active:translate-y-px',
  pgm:      'bg-[--color-pgm] hover:brightness-110 text-white font-bold border border-red-900 active:translate-y-px',
  pvw:      'bg-[--color-pvw] hover:brightness-110 text-white font-bold border border-green-900 active:translate-y-px',
  ghost:    'bg-transparent hover:bg-[--color-surface-raised] border border-transparent text-[--color-text-muted] hover:text-orange-500',
  danger:   'bg-[#f96c6c] hover:brightness-110 border-0 text-[--color-text-dark] font-bold active:translate-y-px',
}

const sizeClasses = {
  sm: 'px-3 py-1 text-xs rounded',
  md: 'px-4 py-1.5 text-sm rounded',
  lg: 'px-5 py-2.5 text-sm rounded',
}

export function Button({ variant = 'default', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium transition-all cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
