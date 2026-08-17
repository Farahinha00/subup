import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { dispositifId, type, texte } = await req.json()
  if (!dispositifId || !type || !texte) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }
  if (!['document', 'etape'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  const { error } = await supabase.from('dossier_signalements').insert({
    user_id: user.id,
    dispositif_id: dispositifId,
    type,
    texte: texte.trim().slice(0, 500),
  })

  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
