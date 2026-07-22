import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Resultat } from '@/types'
import ResultatsClient from './ResultatsClient'

export default async function ResultatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: diagnostic }, { data: profile }] = await Promise.all([
    supabase.from('diagnostics').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('profiles').select('prenom, nom, entreprise').eq('id', user.id).single(),
  ])

  if (!diagnostic) notFound()

  const { data: resultats } = await supabase
    .from('resultats')
    .select('*, dispositif:dispositifs(*)')
    .eq('diagnostic_id', id)
    .order('score', { ascending: false })

  const { data: demandes } = await supabase
    .from('demandes_accompagnement')
    .select('dispositif_id')
    .eq('diagnostic_id', id)
    .eq('user_id', user.id)

  const demandesSet = new Set((demandes ?? []).map((d) => d.dispositif_id))
  const nomEntreprise = profile?.entreprise ?? profile?.prenom ?? user.email?.split('@')[0] ?? 'Mon entreprise'

  return (
    <ResultatsClient
      diagnosticId={id}
      resultats={(resultats ?? []) as Resultat[]}
      demandesExistantes={demandesSet}
      pays={diagnostic.pays ?? 'MA'}
      nomEntreprise={nomEntreprise}
    />
  )
}
