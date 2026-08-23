import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSupabasePublic } from '@/lib/supabase/public'
import { matcherTousDispositifs } from '@/lib/matching/engine'
import type { Dispositif, Reponses } from '@/types'

// Cache dispositifs 1h — revalidé par tag 'dispositifs' si l'admin modifie
const getDispositifsActifs = unstable_cache(
  async (pays: string) => {
    const { data } = await getSupabasePublic()
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) console.error('[matching] auth error:', authError)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { diagnosticId?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }) }
  const { diagnosticId } = body
  if (!diagnosticId) return NextResponse.json({ error: 'diagnosticId manquant' }, { status: 400 })

  const { data: diagnostic, error: diagError } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('id', diagnosticId)
    .eq('user_id', user.id)
    .single()

  if (diagError) console.error('[matching] diagnostic fetch error:', diagError)
  if (!diagnostic) return NextResponse.json({ error: 'Diagnostic introuvable' }, { status: 404 })

  const pays = (diagnostic.pays ?? diagnostic.reponses?.pays ?? 'MA') as string
  console.log('[matching] pays:', pays, '| diagnosticId:', diagnosticId)

  const dispositifs = await getDispositifsActifs(pays)

  if (!dispositifs.length) {
    return NextResponse.json({ error: `Aucun dispositif actif pour pays=${pays}` }, { status: 500 })
  }

  await supabase.from('resultats').delete().eq('diagnostic_id', diagnosticId)

  const resultats = matcherTousDispositifs(dispositifs as Dispositif[], diagnostic.reponses as Reponses)
  console.log('[matching] résultats calculés:', resultats.length)

  const rows = resultats.map((r) => ({
    diagnostic_id: diagnosticId,
    dispositif_id: r.dispositif_id,
    score: r.score,
    statut: r.statut,
    criteres_ok: r.criteres_ok,
    criteres_manquants: r.criteres_manquants,
    criteres_bloquants: r.criteres_bloquants,
  }))

  const { error: insertError } = await supabase.from('resultats').insert(rows)
  if (insertError) {
    console.error('[matching] insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: rows.length })
}
