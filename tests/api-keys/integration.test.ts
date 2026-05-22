import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const dbRows: Record<string, { user_id: string; key_hash: string; prefix: string; revoked_at: string | null }> = {}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
    from: vi.fn(() => ({
      insert: vi.fn((row) => {
        dbRows[row.key_hash] = { ...row, revoked_at: null }
        return { error: null }
      }),
      update: vi.fn((patch) => ({
        eq: vi.fn((col, val) => {
          const entry = Object.values(dbRows).find((r) => r.key_hash === val || col === 'id')
          if (entry) entry.revoked_at = patch.revoked_at
          return { error: null }
        }),
      })),
      select: vi.fn(() => ({
        eq: vi.fn((col, val) => ({
          is: vi.fn(() => ({
            single: vi.fn(() => {
              const row = dbRows[val]
              if (!row || row.revoked_at !== null) return { data: null, error: { code: 'PGRST116' } }
              return { data: { user_id: row.user_id, revoked_at: null }, error: null }
            }),
          })),
        })),
      })),
    })),
  })),
}))

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn((_, hash) => ({
          is: vi.fn(() => ({
            single: vi.fn(() => {
              const row = dbRows[hash]
              if (!row || row.revoked_at !== null) return { data: null, error: { code: 'PGRST116' } }
              return { data: { user_id: row.user_id, revoked_at: null }, error: null }
            }),
          })),
        })),
      })),
    })),
  })),
}))

describe('API Keys integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(dbRows).forEach((k) => delete dbRows[k])
  })

  it('create → validate → revoke → validate again (should fail)', async () => {
    const { createApiKey } = await import('@/app/dashboard/api-keys/actions')
    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    const { hashApiKey } = await import('@/lib/auth/apiKeys')

    // 1. Create
    const createResult = await createApiKey('Mi key de test')
    expect(createResult).toHaveProperty('key')
    const rawKey = (createResult as { key: string }).key
    expect(rawKey).toMatch(/^bnly_/)

    // 2. Validate — should return user_id
    const userId = await validateApiKey(rawKey)
    expect(userId).toBe('user-123')

    // 3. Revoke — find the row by hash and update it
    const hash = await hashApiKey(rawKey)
    const row = dbRows[hash]
    expect(row).toBeDefined()
    row.revoked_at = new Date().toISOString()

    // 4. Validate again — should return null
    const userIdAfterRevoke = await validateApiKey(rawKey)
    expect(userIdAfterRevoke).toBeNull()
  })
})
