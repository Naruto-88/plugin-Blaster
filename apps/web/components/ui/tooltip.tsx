"use client"
import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={
      'z-50 overflow-hidden rounded-md border bg-white px-2.5 py-1.5 text-xs shadow-md dark:bg-zinc-900 dark:border-zinc-800'
      + (className ? ` ${className}` : '')
    }
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

