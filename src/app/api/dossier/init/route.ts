import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consommerCredit } from '@/lib/credits'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { dispositifId, diagnosticId, donnees } = await req.json() as {
    dispositifId: string
    diagnosticId: string | null
    donnees: Record<string, unknown>
  }

  const ok = await consommerCredit(user.id)
  if (!ok) return NextResponse.json({ error: 'no_credits' }, { status: 402 })

  const { data: dossier, error } = await supabase
    .from('dossiers_generes')
    .insert({
      user_id: user.id,
      dispositif_id: dispositifId,
      diagnostic_id: diagnosticId ?? null,
      statut: 'documents_en_cours',
      donnees_completes: donnees,
    })
    .select()
    .single()

  if (error || !dossier) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ dossierId: dossier.id })
}
