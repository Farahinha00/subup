import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { dispositifId, checks_done, docs_done, deposit_done, steps_validated } = body

  if (!dispositifId) return NextResponse.json({ error: 'dispositifId manquant' }, { status: 400 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (checks_done !== undefined) update.checks_done = checks_done
  if (docs_done !== undefined) update.docs_done = docs_done
  if (deposit_done !== undefined) update.deposit_done = deposit_done
  if (steps_validated !== undefined) update.steps_validated = steps_validated

  const { error } = await supabase
    .from('dossier_parcours')
    .update(update)
    .eq('user_id', user.id)
    .eq('dispositif_id', dispositifId)

  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
