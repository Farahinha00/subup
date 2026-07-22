import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crediterCompte } from '@/lib/credits'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { packId } = await req.json() as { packId: string }

  const { data: pack } = await supabase
    .from('packs_dossiers')
    .select('*')
    .eq('id', packId)
    .eq('actif', true)
    .single()

  if (!pack) return NextResponse.json({ error: 'pack_not_found' }, { status: 404 })

  await crediterCompte(user.id, pack.nb_dossiers, packId, pack.prix_total)

  return NextResponse.json({ ok: true, nb_dossiers: pack.nb_dossiers })
}
