import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('generateApiKey', () => {
  it('returns a key with bnly_ prefix', async () => {
    const { generateApiKey } = await import('@/lib/auth/apiKeys')
    const { key } = generateApiKey()
    expect(key).toMatch(/^bnly_/)
  })

  it('returns a key longer than 20 characters', async () => {
    const { generateApiKey } = await import('@/lib/auth/apiKeys')
    const { key } = generateApiKey()
    expect(key.length).toBeGreaterThan(20)
  })

  it('returns a prefix with the last 4 chars of the key', async () => {
    const { generateApiKey } = await import('@/lib/auth/apiKeys')
    const { key, prefix } = generateApiKey()
    expect(key.endsWith(prefix)).toBe(true)
  })
})

describe('hashApiKey', () => {
  it('returns a hex string of 64 characters (SHA-256)', async () => {
    const { hashApiKey } = await import('@/lib/auth/apiKeys')
    const hash = await hashApiKey('bnly_test_key_123456')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('same key always produces the same hash', async () => {
    const { hashApiKey } = await import('@/lib/auth/apiKeys')
    const h1 = await hashApiKey('bnly_test_key_123456')
    const h2 = await hashApiKey('bnly_test_key_123456')
    expect(h1).toBe(h2)
  })

  it('different keys produce different hashes', async () => {
    const { hashApiKey } = await import('@/lib/auth/apiKeys')
    const h1 = await hashApiKey('bnly_key_aaa')
    const h2 = await hashApiKey('bnly_key_bbb')
    expect(h1).not.toBe(h2)
  })
})
