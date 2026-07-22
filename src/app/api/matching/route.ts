import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matcherTousDispositifs } from '@/lib/matching/engine'
import type { Dispositif, Reponses } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { diagnosticId } = await request.json()
  if (!diagnosticId) return NextResponse.json({ error: 'diagnosticId manquant' }, { status: 400 })

  // Vérifier que le diagnostic appartient à l'utilisateur
  const { data: diagnostic } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('id', diagnosticId)
    .eq('user_id', user.id)
    .single()

  if (!diagnostic) return NextResponse.json({ error: 'Diagnostic introuvable' }, { status: 404 })

  // Récupérer les dispositifs actifs filtrés par pays du diagnostic
  const pays = diagnostic.pays ?? diagnostic.reponses?.pays ?? 'MA'
  const { data: dispositifs } = await supabase
    .from('dispositifs')
    .select('*')
    .eq('actif', true)
    .eq('pays', pays)

  if (!dispositifs || dispositifs.length === 0) {
    return NextResponse.json({ error: 'Aucun dispositif disponible' }, { status: 500 })
  }

  // Supprimer les anciens résultats si re-calcul
  await supabase.from('resultats').delete().eq('diagnostic_id', diagnosticId)

  // Calculer le matching
  const resultats = matcherTousDispositifs(dispositifs as Dispositif[], diagnostic.reponses as Reponses)

  // Persister les résultats
  const rows = resultats.map((r) => ({
    diagnostic_id: diagnosticId,
    dispositif_id: r.dispositif_id,
    score: r.score,
    statut: r.statut,
    criteres_ok: r.criteres_ok,
    criteres_manquants: r.criteres_manquants,
    criteres_bloquants: r.criteres_bloquants,
  }))

  const { error } = await supabase.from('resultats').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, count: rows.length })
}
