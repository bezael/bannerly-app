import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignUp = vi.fn()
const mockSignIn = vi.fn()
const mockSignOut = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
      getUser: mockGetUser,
    },
  })),
}))

describe('Auth integration flow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('full flow: register → login → logout', async () => {
    // 1. Register
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-abc' }, session: {} },
      error: null,
    })
    const { register } = await import('@/app/(auth)/register/actions')
    const registerData = new FormData()
    registerData.set('email', 'flow@example.com')
    registerData.set('password', 'securepass')
    await expect(register(registerData)).rejects.toThrow('NEXT_REDIRECT')

    // 2. Login
    mockSignIn.mockResolvedValue({
      data: { user: { id: 'user-abc' }, session: {} },
      error: null,
    })
    const { login } = await import('@/app/(auth)/login/actions')
    const loginData = new FormData()
    loginData.set('email', 'flow@example.com')
    loginData.set('password', 'securepass')
    await expect(login(loginData)).rejects.toThrow('NEXT_REDIRECT')

    // 3. Logout
    mockSignOut.mockResolvedValue({ error: null })
    const { logout } = await import('@/app/(auth)/login/actions')
    await expect(logout()).rejects.toThrow('NEXT_REDIRECT')
  })

  it('register with invalid password never calls Supabase', async () => {
    const { register } = await import('@/app/(auth)/register/actions')
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', '123')

    const result = await register(formData)
    expect(result).toMatchObject({ error: expect.any(String) })
    expect(mockSignUp).not.toHaveBeenCalled()
  })
})
