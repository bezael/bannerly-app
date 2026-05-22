import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignIn = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
    },
  })),
}))

describe('login action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to dashboard on successful login', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: { id: 'user-123' }, session: {} },
      error: null,
    })

    const { login } = await import('@/app/(auth)/login/actions')
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')

    await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error on invalid credentials', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const { login } = await import('@/app/(auth)/login/actions')
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'wrongpassword')

    const result = await login(formData)
    expect(result).toEqual({ error: 'Email o contraseña incorrectos' })
  })
})

describe('logout action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to login after sign out', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const { logout } = await import('@/app/(auth)/login/actions')
    await expect(logout()).rejects.toThrow('NEXT_REDIRECT')
  })
})
