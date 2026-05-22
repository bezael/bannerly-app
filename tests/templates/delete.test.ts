import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockGetUser = vi.fn()
const mockGenerationsSelect = vi.fn()
const mockTemplatesDelete = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'generations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: mockGenerationsSelect,
            })),
          })),
        }
      }
      return {
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: mockTemplatesDelete.mockResolvedValue({ error: null }),
          })),
        })),
      }
    }),
  })),
}))

describe('deleteTemplate action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes template when no recent generations exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockGenerationsSelect.mockResolvedValue({ count: 0, error: null })

    const { deleteTemplate } = await import('@/app/dashboard/templates/actions')
    const result = await deleteTemplate('tpl-uuid-1')

    expect(result).toBeUndefined()
    expect(mockTemplatesDelete).toHaveBeenCalled()
  })

  it('blocks deletion when template has recent generations', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockGenerationsSelect.mockResolvedValue({ count: 3, error: null })

    const { deleteTemplate } = await import('@/app/dashboard/templates/actions')
    const result = await deleteTemplate('tpl-uuid-1')

    expect(result).toEqual({ error: expect.stringContaining('24h') })
    expect(mockTemplatesDelete).not.toHaveBeenCalled()
  })

  it('returns error when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { deleteTemplate } = await import('@/app/dashboard/templates/actions')
    const result = await deleteTemplate('tpl-uuid-1')

    expect(result).toEqual({ error: 'No autorizado' })
  })
})
