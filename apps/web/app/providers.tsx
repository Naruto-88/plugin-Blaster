"use client"
import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { TRPCProvider } from '@/lib/trpc'
import { Toaster } from 'sonner'
import AppHeader from '@/components/AppHeader'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        <AppHeader />
        {children}
        <Toaster richColors position="top-center" />
      </TRPCProvider>
    </SessionProvider>
  )
}
