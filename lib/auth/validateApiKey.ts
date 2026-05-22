import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { hashApiKey } from './apiKeys'

export async function validateApiKey(key: string): Promise<string | null> {
  if (!key || !key.startsWith('bnly_')) return null

  const keyHash = await hashApiKey(key)
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id, revoked_at')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single()

  if (error || !data) return null

  return data.user_id
}
