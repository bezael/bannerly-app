import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  generationsThisMonth: number
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const { count, error } = await supabase
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  if (error) return { generationsThisMonth: 0 }

  return { generationsThisMonth: count ?? 0 }
}
