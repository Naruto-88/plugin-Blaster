import { describe, it, expect, beforeAll } from 'vitest'
import { encrypt, decrypt, sha256Hex } from './crypto'

beforeAll(() => {
  process.env.MASTER_ENCRYPTION_KEY = 'base64:' + Buffer.from(crypto.randomUUID().replaceAll('-', '').slice(0,32)).toString('base64')
})

describe('crypto', () => {
  it('encrypt/decrypt roundtrip', async () => {
    const pt = 'hello-world'
    const ct = await encrypt(pt)
    const rt = await decrypt(ct)
    expect(rt).toBe(pt)
  })
  it('sha256Hex', () => {
    expect(sha256Hex('a')).toHaveLength(64)
  })
})

