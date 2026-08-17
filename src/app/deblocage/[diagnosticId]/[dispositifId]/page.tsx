import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DeblocageClient from './DeblocageClient'

export default async function DeblocagePage({
  params,
}: {
  params: Promise<{ diagnosticId: string; dispositifId: string }>
}) {
  const { diagnosticId, dispositifId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: dispositif }, { data: credits }, { data: parcours }] = await Promise.all([
    supabase.from('dispositifs').select('id, nom').eq('id', dispositifId).single(),
    supabase.from('credits').select('solde').eq('user_id', user.id).single(),
    supabase.from('dossier_parcours').select('unlocked').eq('user_id', user.id).eq('dispositif_id', dispositifId).single(),
  ])

  if (!dispositif) notFound()

  // Déjà débloqué → rediriger directement vers le dossier
  if (parcours?.unlocked) {
    redirect(`/dossier/${diagnosticId}/${dispositifId}`)
  }

  return (
    <DeblocageClient
      diagnosticId={diagnosticId}
      dispositifId={dispositifId}
      nomDispositif={dispositif.nom}
      solde={credits?.solde ?? 0}
    />
  )
}
