import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockIsNull = vi.fn()

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          is: mockIsNull.mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
    })),
  })),
}))

describe('validateApiKey', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns user_id for a valid non-revoked key', async () => {
    mockSingle.mockResolvedValue({
      data: { user_id: 'user-abc', revoked_at: null },
      error: null,
    })

    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    const result = await validateApiKey('bnly_validkey12345678')
    expect(result).toBe('user-abc')
  })

  it('returns null when key is not found', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    })

    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    const result = await validateApiKey('bnly_nonexistentkey')
    expect(result).toBeNull()
  })

  it('returns null for an empty key string', async () => {
    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    const result = await validateApiKey('')
    expect(result).toBeNull()
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('returns null for a key without bnly_ prefix', async () => {
    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    const result = await validateApiKey('invalid_key_format')
    expect(result).toBeNull()
    expect(mockSelect).not.toHaveBeenCalled()
  })
})
