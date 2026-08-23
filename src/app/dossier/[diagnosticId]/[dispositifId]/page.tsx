import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Dispositif } from '@/types'
import DossierClient from './DossierClient'

export default async function DossierPage({
  params,
}: {
  params: Promise<{ diagnosticId: string; dispositifId: string }>
}) {
  const { diagnosticId, dispositifId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: dispositif }, { data: parcours }] = await Promise.all([
    supabase.from('dispositifs').select('*').eq('id', dispositifId).single(),
    supabase.from('dossier_parcours')
      .select('unlocked, checks_done, docs_done, deposit_done, steps_validated')
      .eq('user_id', user.id)
      .eq('dispositif_id', dispositifId)
      .single(),
  ])

  if (!dispositif) notFound()
  if (!parcours?.unlocked) redirect(`/deblocage/${diagnosticId}/${dispositifId}`)

  return (
    <DossierClient
      diagnosticId={diagnosticId}
      dispositif={dispositif as Dispositif}
      initialChecksDone={parcours.checks_done ?? []}
      initialDocsDone={parcours.docs_done ?? []}
      initialDepositDone={parcours.deposit_done ?? []}
      initialStepsValidated={parcours.steps_validated ?? []}
    />
  )
}
