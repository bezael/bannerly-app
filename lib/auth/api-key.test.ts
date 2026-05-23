import { describe, it, expect } from 'vitest'
import { validateApiKey } from './api-key'

describe('validateApiKey', () => {
  it('returns null for missing header', () => {
    expect(validateApiKey(null)).toBeNull()
  })

  it('returns null for non-Bearer scheme', () => {
    expect(validateApiKey('Basic abc')).toBeNull()
  })

  it('returns null for missing bnly_ prefix', () => {
    expect(validateApiKey('Bearer abcdef')).toBeNull()
  })

  it('returns the key for a valid Bearer token', () => {
    const result = validateApiKey('Bearer bnly_abc123_XY')
    expect(result).toEqual({ key: 'bnly_abc123_XY' })
  })
})
