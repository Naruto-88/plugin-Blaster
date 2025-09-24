"use client"
import { useSession } from 'next-auth/react'

export function useSessionRole() {
  const { data } = useSession()
  return (data?.user as any)?.role as ('admin'|'viewer'|undefined)
}

