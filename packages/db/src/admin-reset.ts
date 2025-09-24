import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '../../.env' })
import { prisma } from './index'
import { scryptSync, randomBytes } from 'crypto'

async function main() {
  const salt = randomBytes(16)
  const hash = scryptSync('admin123!', salt, 64)
  const passwordHash = `${salt.toString('hex')}.${hash.toString('hex')}`
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash },
    create: { email: 'admin@example.com', passwordHash, role: 'admin' }
  })
  console.log('Password reset to admin123!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => process.exit(0))
