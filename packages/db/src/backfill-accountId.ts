import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '../../.env' })
import { prisma } from './index'

async function main() {
  const anySite = await prisma.site.findFirst({ where: { accountId: null } })
  if (!anySite) {
    console.log('No sites without accountId. Nothing to backfill.')
    return
  }
  // Pick an owner account if exists, else create one
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  let account = admin ? await prisma.account.findFirst({ where: { members: { some: { userId: admin.id } } } }) : null
  if (!account) {
    account = await prisma.account.create({ data: { name: 'Default Account', plan: 'free' } })
    if (admin) {
      await prisma.membership.create({ data: { accountId: account.id, userId: admin.id, role: 'owner' } })
    }
  }
  const accId = account!.id
  const updated = await prisma.site.updateMany({ where: { accountId: null }, data: { accountId: accId } })
  console.log(`Backfilled ${updated.count} sites to account ${accId}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => process.exit(0))

