import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

type QueryResult<T = unknown> = { data: T; error: unknown }

/**
 * Builds a chainable mock where every method returns the same object,
 * and the object is itself thenable resolving to `result`. This covers
 * supabase-js fluent chains that terminate at maybeSingle/single/order/eq.
 */
export function mockSupabase<T = unknown>(result: QueryResult<T>) {
  const chain: Record<string, unknown> = {}
  const methods = [
    'select',
    'eq',
    'insert',
    'delete',
    'order',
    'maybeSingle',
    'single',
  ]
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  ;(chain as { then: PromiseLike<QueryResult<T>>['then'] }).then = ((
    onfulfilled,
    onrejected
  ) => Promise.resolve(result).then(onfulfilled, onrejected)) as PromiseLike<
    QueryResult<T>
  >['then']

  const from = vi.fn(() => chain)
  const client = { from } as unknown as SupabaseClient
  return { client, from, chain: chain as Record<string, ReturnType<typeof vi.fn>> }
}
