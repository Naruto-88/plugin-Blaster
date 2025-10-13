import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '../../.env' })
import { prisma } from './index'
import { encrypt } from '@nsm/core'

async function main() {
  const adminEmail = 'admin@example.com'
  const passwordHash = await BunHash('admin123!')

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, role: 'admin' }
  })
  // Ensure account and membership
  let account = await prisma.account.findFirst({ where: { members: { some: { userId: user.id } } } })
  if (!account) {
    account = await prisma.account.create({ data: { name: 'Demo Account', plan: 'starter' } })
    await prisma.membership.create({ data: { accountId: account.id, userId: user.id, role: 'owner' } })
  }

  const sites = [
    { name: 'Example Green', url: 'https://green.example.com', authType: 'bearer_token', bearer: 'token-green' },
    { name: 'Example Yellow', url: 'https://yellow.example.com', authType: 'bearer_token', bearer: 'token-yellow' },
    { name: 'Example Red', url: 'https://red.example.com', authType: 'bearer_token', bearer: 'token-red' }
  ]

  for (const s of sites) {
    await prisma.site.upsert({
      where: { url: s.url },
      update: {},
      create: {
        accountId: account.id,
        name: s.name,
        url: s.url,
        authType: s.authType,
        bearerTokenEnc: await encrypt(s.bearer),
        webhookSecretEnc: await encrypt('changeme-webhook-secret'),
        tags: []
      }
    })
  }
}

async function BunHash(password: string): Promise<string> {
  // Fallback: use scrypt
  const { scryptSync, randomBytes } = await import('crypto')
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `${salt.toString('hex')}.${hash.toString('hex')}`
}

main().then(() => {
  console.log('Seed completed')
  process.exit(0)
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
