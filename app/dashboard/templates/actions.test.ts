import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  return {
    getUser: vi.fn(),
    createTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    revalidatePath: vi.fn(),
    redirect: vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`)
    }),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
  })),
}))

vi.mock('@/lib/templates/create-template', () => ({
  createTemplate: mocks.createTemplate,
}))

vi.mock('@/lib/templates/delete-template', () => ({
  deleteTemplate: mocks.deleteTemplate,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}))

import {
  createTemplateAction,
  deleteTemplateAction,
} from './actions'

function fd(entries: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.append(k, v)
  return f
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  mocks.redirect.mockImplementation((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  })
})

describe('createTemplateAction', () => {
  it('returns error when required fields missing', async () => {
    const result = await createTemplateAction(
      { error: null },
      fd({ slug: '', name: '', layout_id: '' })
    )
    expect(result.error).toMatch(/required/i)
    expect(mocks.createTemplate).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('redirects to /login when not authenticated', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(
      createTemplateAction(
        { error: null },
        fd({ slug: 'a', name: 'b', layout_id: 'c' })
      )
    ).rejects.toThrow('REDIRECT:/login')
    expect(mocks.redirect).toHaveBeenCalledWith('/login')
  })

  it('returns error from createTemplate on failure', async () => {
    mocks.createTemplate.mockResolvedValueOnce({ data: null, error: 'boom' })
    const result = await createTemplateAction(
      { error: null },
      fd({ slug: 'og', name: 'OG', layout_id: 'og-basic' })
    )
    expect(result).toEqual({ error: 'boom' })
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates and returns null error on success', async () => {
    mocks.createTemplate.mockResolvedValueOnce({
      data: { id: 'uuid-1' },
      error: null,
    })
    const result = await createTemplateAction(
      { error: null },
      fd({ slug: 'og', name: 'OG', layout_id: 'og-basic' })
    )
    expect(result).toEqual({ error: null })
    expect(mocks.createTemplate).toHaveBeenCalledWith(
      expect.anything(),
      { slug: 'og', name: 'OG', layout_id: 'og-basic' },
      'user-1'
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard/templates')
  })
})

describe('deleteTemplateAction', () => {
  it('redirects to /login when not authenticated', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(deleteTemplateAction('uuid-1')).rejects.toThrow(
      'REDIRECT:/login'
    )
  })

  it('throws on failure and skips revalidate', async () => {
    mocks.deleteTemplate.mockResolvedValueOnce({ error: 'rls denied' })
    await expect(deleteTemplateAction('uuid-1')).rejects.toThrow('rls denied')
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates on success', async () => {
    mocks.deleteTemplate.mockResolvedValueOnce({ error: null })
    await deleteTemplateAction('uuid-1')
    expect(mocks.deleteTemplate).toHaveBeenCalledWith(
      expect.anything(),
      'uuid-1',
      'user-1'
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard/templates')
  })
})
