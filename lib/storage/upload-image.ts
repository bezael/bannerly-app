import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const BUCKET = 'bannerly-images'

export interface UploadResult {
  id: string
  publicUrl: string
}

export async function uploadImage(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
): Promise<UploadResult> {
  const id = `gen_${randomUUID().replace(/-/g, '')}`
  const path = `${userId}/${id}.png`

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/png',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { id, publicUrl: data.publicUrl }
}
