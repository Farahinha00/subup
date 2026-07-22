import { createClient } from '@/lib/supabase/server'
import type { Pays } from '@/types'

export async function getPaysActifs(): Promise<Pays[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('config_app')
      .select('valeur')
      .eq('cle', 'pays_actifs')
      .single()
    if (Array.isArray(data?.valeur) && data.valeur.length > 0) {
      return data.valeur as Pays[]
    }
  } catch {}
  return ['MA']
}
