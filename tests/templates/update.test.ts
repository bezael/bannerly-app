import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockUpdate = vi.fn()
const mockEqId = vi.fn()
const mockEqUser = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      update: mockUpdate.mockReturnValue({
        eq: mockEqId.mockReturnValue({
          eq: mockEqUser.mockResolvedValue({ error: null }),
        }),
      }),
    })),
  })),
}))

describe('updateTemplate action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates jsx_code and sets updated_at', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })

    const { updateTemplate } = await import('@/app/dashboard/templates/actions')
    await updateTemplate('tpl-uuid-1', { jsx_code: '<div>updated</div>' })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        jsx_code: '<div>updated</div>',
        updated_at: expect.any(String),
      })
    )
    expect(mockEqId).toHaveBeenCalledWith('id', 'tpl-uuid-1')
    expect(mockEqUser).toHaveBeenCalledWith('user_id', 'user-123')
  })

  it('returns error when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { updateTemplate } = await import('@/app/dashboard/templates/actions')
    const result = await updateTemplate('tpl-uuid-1', { name: 'New name' })

    expect(result).toEqual({ error: 'No autorizado' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
