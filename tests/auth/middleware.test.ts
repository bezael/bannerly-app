import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: vi.fn((url: URL) => ({ type: 'redirect', url: url.toString() })),
      next: vi.fn(() => ({ type: 'next' })),
    },
  }
})

async function getMiddleware() {
  vi.resetModules()
  const mod = await import('@/middleware')
  return mod.middleware
}

describe('middleware', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects unauthenticated request to /dashboard → /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const middleware = await getMiddleware()

    const req = new NextRequest('http://localhost:3000/dashboard')
    await middleware(req)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' })
    )
  })

  it('allows authenticated request to /dashboard through', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    const middleware = await getMiddleware()

    const req = new NextRequest('http://localhost:3000/dashboard')
    await middleware(req)

    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('allows unauthenticated access to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const middleware = await getMiddleware()

    const req = new NextRequest('http://localhost:3000/login')
    await middleware(req)

    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })
})
