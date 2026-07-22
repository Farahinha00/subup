import { createClient } from '@/lib/supabase/server'

export async function getSolde(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('credits')
    .select('solde')
    .eq('user_id', userId)
    .single()
  return data?.solde ?? 0
}

export async function consommerCredit(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.from('credits').select('solde').eq('user_id', userId).single()
  const solde = data?.solde ?? 0
  if (solde < 1) return false

  await supabase.from('credits')
    .update({ solde: solde - 1, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  await supabase.from('credits_transactions').insert({
    user_id: userId, delta: -1, motif: 'consommation',
  })
  return true
}

export async function crediterCompte(
  userId: string, delta: number, packId: string, prix: number
): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase.from('credits').select('solde').eq('user_id', userId).single()
  const current = data?.solde ?? 0

  await supabase.from('credits').upsert(
    { user_id: userId, solde: current + delta, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  await supabase.from('credits_transactions').insert({
    user_id: userId, delta, motif: 'achat', pack_achete: packId, prix_paye: prix,
  })
}
