import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@nsm/db'
import { scryptSync, timingSafeEqual } from 'crypto'

function verifyPassword(stored: string, password: string): boolean {
  const [saltHex, hashHex] = stored.split('.')
  const salt = Buffer.from(saltHex, 'hex')
  const hash = Buffer.from(hashHex, 'hex')
  const test = scryptSync(password, salt, hash.length)
  return timingSafeEqual(hash, test)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') return res.status(404).end()
  const email = (req.query.email as string) || ''
  const password = (req.query.password as string) || ''
  if (!email) return res.status(400).json({ error: 'email required' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.json({ exists: false })
  let passOk = false
  if (password) {
    try { passOk = verifyPassword(user.passwordHash, password) } catch {}
  }
  return res.json({ exists: true, role: user.role, passOk })
}

