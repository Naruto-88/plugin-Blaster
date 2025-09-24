import Credentials from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import { prisma } from '@nsm/db'
import { scryptSync, timingSafeEqual } from 'crypto'

export function verifyPassword(stored: string, password: string): boolean {
  const [saltHex, hashHex] = stored.split('.')
  const salt = Buffer.from(saltHex, 'hex')
  const hash = Buffer.from(hashHex, 'hex')
  const test = scryptSync(password, salt, hash.length)
  return timingSafeEqual(hash, test)
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(creds) {
        try {
          if (!creds?.email || !creds.password) return null
          const user = await prisma.user.findUnique({ where: { email: creds.email } })
          if (!user) return null
          const ok = verifyPassword(user.passwordHash, creds.password)
          if (!ok) return null
          return { id: user.id, email: user.email, role: user.role }
        } catch (e) {
          console.error('NextAuth authorize error:', e)
          return null
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = (token as any).role
      return session
    },
  },
}

