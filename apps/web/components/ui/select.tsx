"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-9 rounded-md border border-zinc-300 px-2 py-1 text-sm shadow-sm transition-colors',
          'bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200',
          'dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:focus:ring-zinc-800',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

