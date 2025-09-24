"use client"
import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { TRPCProvider } from '@/lib/trpc'
import { Toaster } from 'sonner'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        {children}
        <Toaster richColors position="top-center" />
      </TRPCProvider>
    </SessionProvider>
  )
}

