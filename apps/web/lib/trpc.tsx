"use client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/trpc'
import { useState, type ReactNode } from 'react'

export const trpc = createTRPCReact<AppRouter>()

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [client] = useState(() => trpc.createClient({
    links: [httpBatchLink({ url: '/api/trpc' })]
  }))
  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

