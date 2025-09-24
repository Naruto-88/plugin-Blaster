import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import * as React from 'react'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900',
        secondary: 'border-transparent bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
        outline: 'text-foreground'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
