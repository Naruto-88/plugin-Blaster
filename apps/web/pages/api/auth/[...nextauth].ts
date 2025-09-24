import type { NextApiRequest, NextApiResponse } from 'next'
import NextAuth from 'next-auth'
import { authOptions } from '@/server/auth'

export default function auth(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, authOptions as any)
}
