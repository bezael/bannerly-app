import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGte = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: mockGte,
        })),
      })),
    })),
  })),
}))

describe('getDashboardStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns count of generations from current month', async () => {
    mockGte.mockResolvedValue({ count: 7, error: null })

    const { getDashboardStats } = await import('@/lib/dashboard/stats')
    const result = await getDashboardStats('user-123')

    expect(result.generationsThisMonth).toBe(7)
    expect(mockGte).toHaveBeenCalledWith('created_at', expect.any(String))
  })

  it('returns 0 when there are no generations this month', async () => {
    mockGte.mockResolvedValue({ count: 0, error: null })

    const { getDashboardStats } = await import('@/lib/dashboard/stats')
    const result = await getDashboardStats('user-123')

    expect(result.generationsThisMonth).toBe(0)
  })

  it('returns 0 on DB error instead of throwing', async () => {
    mockGte.mockResolvedValue({ count: null, error: { message: 'DB error' } })

    const { getDashboardStats } = await import('@/lib/dashboard/stats')
    const result = await getDashboardStats('user-123')

    expect(result.generationsThisMonth).toBe(0)
  })
})
