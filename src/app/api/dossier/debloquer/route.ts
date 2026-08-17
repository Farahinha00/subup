import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { diagnosticId, dispositifId } = await req.json()
  if (!dispositifId) return NextResponse.json({ error: 'dispositifId manquant' }, { status: 400 })

  // Vérifier si déjà débloqué
  const { data: existing } = await supabase
    .from('dossier_parcours')
    .select('id, unlocked')
    .eq('user_id', user.id)
    .eq('dispositif_id', dispositifId)
    .single()

  if (existing?.unlocked) {
    return NextResponse.json({ ok: true, alreadyUnlocked: true })
  }

  // Consommer 1 crédit
  const { data: credits } = await supabase
    .from('credits')
    .select('solde')
    .eq('user_id', user.id)
    .single()

  const solde = credits?.solde ?? 0
  if (solde < 1) return NextResponse.json({ error: 'Solde insuffisant' }, { status: 402 })

  // Transaction : décrémenter crédit + créer/mettre à jour parcours
  const [creditResult, parcoursResult] = await Promise.all([
    supabase.from('credits').update({ solde: solde - 1, updated_at: new Date().toISOString() }).eq('user_id', user.id),
    supabase.from('dossier_parcours').upsert({
      user_id: user.id,
      dispositif_id: dispositifId,
      diagnostic_id: diagnosticId ?? null,
      unlocked: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,dispositif_id' }),
  ])

  if (creditResult.error || parcoursResult.error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  await supabase.from('credits_transactions').insert({
    user_id: user.id, delta: -1, motif: 'consommation',
  })

  return NextResponse.json({ ok: true })
}
