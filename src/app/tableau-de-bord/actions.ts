'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function supprimerDiagnostic(diagnosticId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  await supabase.from('diagnostics').delete().eq('id', diagnosticId).eq('user_id', user.id)
  revalidatePath('/tableau-de-bord')
}
