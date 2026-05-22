import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockReturnValue({
            range: mockRange,
          }),
        }),
      }),
    })),
  })),
}))

describe('getGenerations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated generations for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockRange.mockResolvedValue({
      data: [
        { id: 'gen_1', image_url: 'https://cdn.example.com/1.png', created_at: '2025-01-01', templates: { name: 'OG Basic' } },
        { id: 'gen_2', image_url: 'https://cdn.example.com/2.png', created_at: '2025-01-02', templates: { name: 'OG Wide' } },
      ],
      count: 2,
      error: null,
    })

    const { getGenerations } = await import('@/lib/dashboard/generations')
    const result = await getGenerations('user-123', { page: 1, limit: 20 })

    expect(result.data).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(mockRange).toHaveBeenCalledWith(0, 19)
  })

  it('calculates correct offset for page 2', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockRange.mockResolvedValue({ data: [], count: 0, error: null })

    const { getGenerations } = await import('@/lib/dashboard/generations')
    await getGenerations('user-123', { page: 2, limit: 20 })

    expect(mockRange).toHaveBeenCalledWith(20, 39)
  })

  it('returns empty list when user has no generations', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockRange.mockResolvedValue({ data: [], count: 0, error: null })

    const { getGenerations } = await import('@/lib/dashboard/generations')
    const result = await getGenerations('user-123', { page: 1, limit: 20 })

    expect(result.data).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})
