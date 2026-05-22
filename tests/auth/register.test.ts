import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignUp = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      getUser: mockGetUser,
    },
  })),
}))

describe('register action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to dashboard on successful sign up', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' }, session: {} },
      error: null,
    })

    const { register } = await import('@/app/(auth)/register/actions')
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')

    await expect(register(formData)).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when email already in use', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    })

    const { register } = await import('@/app/(auth)/register/actions')
    const formData = new FormData()
    formData.set('email', 'existing@example.com')
    formData.set('password', 'password123')

    const result = await register(formData)
    expect(result).toEqual({ error: 'Email ya en uso' })
  })

  it('returns error when password is too short', async () => {
    const { register } = await import('@/app/(auth)/register/actions')
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'short')

    const result = await register(formData)
    expect(result).toEqual({ error: 'La contraseña debe tener al menos 8 caracteres' })
  })
})
