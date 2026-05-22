'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/auth/apiKeys'

export async function createApiKey(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { key, prefix } = generateApiKey()
  const key_hash = await hashApiKey(key)

  const { error } = await supabase.from('api_keys').insert({
    user_id: user.id,
    name,
    key_hash,
    prefix,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/api-keys')
  return { key }
}

export async function revokeApiKey(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/api-keys')
}
