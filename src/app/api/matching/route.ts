import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabasePublic } from '@/lib/supabase/public'
import { matcherTousDispositifs } from '@/lib/matching/engine'
import type { Dispositif, Reponses } from '@/types'

// Cache dispositifs 1h — revalidé par tag 'dispositifs' si l'admin modifie
const getDispositifsActifs = unstable_cache(
  async (pays: string) => {
    const { data } = await supabasePublic
      .from('dispositifs')
      .select('*')
      .eq('actif', true)
      .eq('pays', pays)
    return data ?? []
  },
  ['dispositifs-actifs'],
  { revalidate: 3600, tags: ['dispositifs'] }
)

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { diagnosticId } = await request.json()
  if (!diagnosticId) return NextResponse.json({ error: 'diagnosticId manquant' }, { status: 400 })

  const { data: diagnostic } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('id', diagnosticId)
    .eq('user_id', user.id)
    .single()

  if (!diagnostic) return NextResponse.json({ error: 'Diagnostic introuvable' }, { status: 404 })

  const pays = diagnostic.pays ?? diagnostic.reponses?.pays ?? 'MA'
  const dispositifs = await getDispositifsActifs(pays)

  if (!dispositifs.length) {
    return NextResponse.json({ error: 'Aucun dispositif disponible' }, { status: 500 })
  }

  await supabase.from('resultats').delete().eq('diagnostic_id', diagnosticId)

  const resultats = matcherTousDispositifs(dispositifs as Dispositif[], diagnostic.reponses as Reponses)

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
