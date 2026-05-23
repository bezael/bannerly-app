import { describe, it, expect } from 'vitest'
import { deleteTemplate } from './delete-template'
import { mockSupabase } from './test-utils'

describe('deleteTemplate', () => {
  it('returns { error: null } on success', async () => {
    const { client, from, chain } = mockSupabase({ data: null, error: null })
    const result = await deleteTemplate(client, 'uuid-1', 'user-1')

    expect(result).toEqual({ error: null })
    expect(from).toHaveBeenCalledWith('templates')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'uuid-1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('returns error message on failure', async () => {
    const { client } = mockSupabase({
      data: null,
      error: { message: 'rls denied' },
    })
    const result = await deleteTemplate(client, 'uuid-1', 'user-1')
    expect(result).toEqual({ error: 'rls denied' })
  })
})
