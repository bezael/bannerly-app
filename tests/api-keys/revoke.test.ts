import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      update: mockUpdate.mockReturnValue({ eq: mockEq }),
    })),
  })),
}))

describe('revokeApiKey action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates revoked_at for the given key id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockEq.mockResolvedValue({ error: null })

    const { revokeApiKey } = await import('@/app/dashboard/api-keys/actions')
    await revokeApiKey('key-uuid-123')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ revoked_at: expect.any(String) })
    )
    expect(mockEq).toHaveBeenCalledWith('id', 'key-uuid-123')
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { revokeApiKey } = await import('@/app/dashboard/api-keys/actions')
    const result = await revokeApiKey('key-uuid-123')

    expect(result).toEqual({ error: 'No autorizado' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
