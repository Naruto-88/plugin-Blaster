import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '../../.env' })
import { prisma } from './index'
import { scryptSync, randomBytes } from 'crypto'

async function main() {
  const salt = randomBytes(16)
  const hash = scryptSync('naruto@123#', salt, 64)
  const passwordHash = `${salt.toString('hex')}.${hash.toString('hex')}`
  const user = await prisma.user.upsert({
    where: { email: 'weerasinghemelaka@gmail.com' },
    update: { passwordHash },
    create: { email: 'weerasinghemelaka@gmail.com', passwordHash, role: 'admin' }
  })
  // Ensure membership
  const has = await prisma.membership.findFirst({ where: { userId: user.id } })
  if (!has) {
    const acc = await prisma.account.create({ data: { name: 'Admin Account', plan: 'starter' } })
    await prisma.membership.create({ data: { accountId: acc.id, userId: user.id, role: 'owner' } })
  }
  console.log('Password reset to naruto@123# for weerasinghemelaka@gmail.com')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => process.exit(0))
