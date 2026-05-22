import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockInsert = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({ insert: mockInsert })),
  })),
}))

describe('createTemplate action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a template with tpl_ prefixed uid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockInsert.mockResolvedValue({ error: null })

    const { createTemplate } = await import('@/app/dashboard/templates/actions')
    await createTemplate({ name: 'OG Test', width: 1200, height: 630, jsx_code: '<div>test</div>' })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        template_uid: expect.stringMatching(/^tpl_/),
        jsx_code: '<div>test</div>',
        name: 'OG Test',
        width: 1200,
        height: 630,
        user_id: 'user-123',
      })
    )
  })

  it('returns error when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { createTemplate } = await import('@/app/dashboard/templates/actions')
    const result = await createTemplate({ name: 'Test', width: 1200, height: 630, jsx_code: '<div/>' })

    expect(result).toEqual({ error: 'No autorizado' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns error when name is empty', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })

    const { createTemplate } = await import('@/app/dashboard/templates/actions')
    const result = await createTemplate({ name: '', width: 1200, height: 630, jsx_code: '<div/>' })

    expect(result).toEqual({ error: 'El nombre es obligatorio' })
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
