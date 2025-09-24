import { randomBytes, createHash, webcrypto } from 'crypto'

// MASTER_ENCRYPTION_KEY: base64 32 bytes (AES-256-GCM)
function getMasterKey(): Uint8Array {
  const raw = process.env.MASTER_ENCRYPTION_KEY || ''
  if (!raw) throw new Error('MASTER_ENCRYPTION_KEY missing')
  const base64 = raw.startsWith('base64:') ? raw.slice(7) : raw
  const buf = Buffer.from(base64, 'base64')
  if (buf.byteLength !== 32) throw new Error('MASTER_ENCRYPTION_KEY must be 32 bytes base64')
  return new Uint8Array(buf)
}

export async function encrypt(plaintext: string): Promise<string> {
  const keyBytes = getMasterKey()
  return encryptWithKey(plaintext, keyBytes)
}

export async function encryptWithKey(plaintext: string, keyBytes: Uint8Array): Promise<string> {
  const iv = randomBytes(12)
  const key = await webcrypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  const ct = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, Buffer.from(plaintext))
  const out = Buffer.concat([iv, Buffer.from(ct)])
  return out.toString('base64')
}

export async function decrypt(ciphertextB64: string): Promise<string> {
  const keyBytes = getMasterKey()
  return decryptWithKey(ciphertextB64, keyBytes)
}

export async function decryptWithKey(ciphertextB64: string, keyBytes: Uint8Array): Promise<string> {
  const buf = Buffer.from(ciphertextB64, 'base64')
  const iv = buf.subarray(0, 12)
  const data = buf.subarray(12)
  const key = await webcrypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  const pt = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return Buffer.from(pt).toString()
}

export function hmacSHA256Base64(key: string, payload: string): string {
  const cryptoKey = Buffer.from(key)
  const hmac = webcrypto as unknown as undefined
  // Node's webcrypto HMAC is async; use createHash alternative via keyed hash: not supported.
  // Simpler: use node:crypto createHmac (not in webcrypto) for compatibility.
  const { createHmac } = require('crypto') as typeof import('crypto')
  return createHmac('sha256', cryptoKey).update(payload).digest('base64')
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function rotateCiphertextKey(ciphertextB64: string): Promise<string> {
  return decrypt(ciphertextB64).then(encrypt)
}

export function parseKeyB64(input: string): Uint8Array {
  const base64 = input.startsWith('base64:') ? input.slice(7) : input
  const buf = Buffer.from(base64, 'base64')
  if (buf.byteLength !== 32) throw new Error('key must be 32 bytes base64')
  return new Uint8Array(buf)
}

