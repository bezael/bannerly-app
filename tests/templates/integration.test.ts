import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

interface DbTemplate {
  id: string
  user_id: string
  template_uid: string
  name: string
  jsx_code: string
  width: number
  height: number
  updated_at?: string
}

const db: { templates: DbTemplate[]; generationsCount: number } = {
  templates: [],
  generationsCount: 0,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
    from: vi.fn((table: string) => {
      if (table === 'templates') {
        return {
          insert: vi.fn((row) => {
            db.templates.push({ ...row, id: `uuid-${db.templates.length}` })
            return { error: null }
          }),
          update: vi.fn((patch) => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => {
                const tpl = db.templates[0]
                if (tpl) Object.assign(tpl, patch)
                return { error: null }
              }),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => {
                db.templates.splice(0, 1)
                return { error: null }
              }),
            })),
          })),
        }
      }
      if (table === 'generations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn().mockResolvedValue({ count: db.generationsCount, error: null }),
            })),
          })),
        }
      }
    }),
  })),
}))

describe('Templates integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.templates = []
    db.generationsCount = 0
  })

  it('create → edit → delete (no recent generations)', async () => {
    const { createTemplate, updateTemplate, deleteTemplate } = await import('@/app/dashboard/templates/actions')

    // 1. Create
    await createTemplate({ name: 'Test OG', width: 1200, height: 630, jsx_code: '<div>v1</div>' })
    expect(db.templates).toHaveLength(1)
    expect(db.templates[0].template_uid).toMatch(/^tpl_/)

    // 2. Edit
    await updateTemplate(db.templates[0].id, { jsx_code: '<div>v2</div>' })
    expect(db.templates[0].jsx_code).toBe('<div>v2</div>')
    expect(db.templates[0].updated_at).toBeDefined()

    // 3. Delete — no recent generations
    db.generationsCount = 0
    await deleteTemplate(db.templates[0].id)
    expect(db.templates).toHaveLength(0)
  })

  it('delete blocked when recent generations exist', async () => {
    const { createTemplate, deleteTemplate } = await import('@/app/dashboard/templates/actions')

    await createTemplate({ name: 'Busy', width: 1200, height: 630, jsx_code: '<div/>' })
    db.generationsCount = 5

    const result = await deleteTemplate(db.templates[0].id)
    expect(result).toEqual({ error: expect.stringContaining('24h') })
    expect(db.templates).toHaveLength(1)
  })
})
