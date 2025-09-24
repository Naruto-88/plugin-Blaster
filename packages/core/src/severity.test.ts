import { describe, it, expect } from 'vitest'
import { severityFor } from './severity'

describe('severityFor', () => {
  it('red when unreachable', () => {
    const s: any = { status: 'unreachable', lastCheckedAt: new Date(), hasAnyUpdate: false, hasSecurityUpdate: false }
    expect(severityFor(s)).toBe('red')
  })
  it('yellow when updates', () => {
    const s: any = { status: 'ok', lastCheckedAt: new Date(), hasAnyUpdate: true, hasSecurityUpdate: false }
    expect(severityFor(s)).toBe('yellow')
  })
  it('gray when never checked', () => {
    const s: any = { status: 'unknown', lastCheckedAt: null, hasAnyUpdate: false, hasSecurityUpdate: false }
    expect(severityFor(s)).toBe('gray')
  })
  it('green when ok', () => {
    const s: any = { status: 'ok', lastCheckedAt: new Date(), hasAnyUpdate: false, hasSecurityUpdate: false }
    expect(severityFor(s)).toBe('green')
  })
})

