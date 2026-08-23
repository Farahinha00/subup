import { createClient } from '@/lib/supabase/server'
import type { Pays } from '@/types'

export async function getPaysActifs(): Promise<Pays[]> {
  return ['MA']
}
