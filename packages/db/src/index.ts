import { PrismaClient } from '@prisma/client'

// Ensure a single PrismaClient instance per process (avoids too many connections in dev/hot-reload)
const globalForPrisma = globalThis

// @ts-ignore allow attaching a field on globalThis
export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore allow attaching a field on globalThis
  globalForPrisma.prisma = prisma
}

export * from '@prisma/client'
