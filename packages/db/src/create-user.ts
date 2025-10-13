import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '../../.env' })
import { prisma } from './index'
import { scryptSync, randomBytes } from 'crypto'

async function main() {
  const email = process.env.USER_EMAIL || process.argv[2]
  const password = process.env.USER_PASSWORD || process.argv[3]
  const role = (process.env.USER_ROLE || 'admin') as 'admin' | 'viewer'

  if (!email || !password) {
    console.error('Provide USER_EMAIL and USER_PASSWORD (envs or args).')
    console.error('Example (PowerShell): $env:USER_EMAIL="melaka@gmail.com"; $env:USER_PASSWORD="melaka@123"; pnpm db:create-admin')
    process.exit(1)
  }

  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  const passwordHash = `${salt.toString('hex')}.${hash.toString('hex')}`

  const upserted = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role },
    create: { email, passwordHash, role }
  })
  // Ensure membership
  const has = await prisma.membership.findFirst({ where: { userId: upserted.id } })
  if (!has) {
    const acc = await prisma.account.create({ data: { name: `Personal - ${email}`, plan: 'free' } })
    await prisma.membership.create({ data: { accountId: acc.id, userId: upserted.id, role: 'owner' } })
  }
  console.log(`User upserted: ${email} (role=${role})`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => process.exit(0))
