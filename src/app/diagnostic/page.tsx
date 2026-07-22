import { getPaysActifs } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'
import DiagnosticPageClient from './DiagnosticPageClient'
import type { Reponses } from '@/types'

export default async function DiagnosticPage() {
  const paysActifs = await getPaysActifs()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profileReponses: Partial<Reponses> | null = null

  if (user) {
    const [{ count }, { data: profile }] = await Promise.all([
      supabase.from('diagnostics').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])

    const isFirstDiagnostic = (count ?? 0) === 0

    if (!isFirstDiagnostic && profile) {
      profileReponses = {}
      if (profile.secteur) profileReponses.secteur = profile.secteur as Reponses['secteur']
      if (profile.statut_juridique) profileReponses.statut_juridique = profile.statut_juridique as Reponses['statut_juridique']
      if (profile.annee_creation) profileReponses.annee_creation = profile.annee_creation
      if (profile.ca_annuel) profileReponses.ca_annuel = profile.ca_annuel as Reponses['ca_annuel']
      if (profile.effectif) profileReponses.effectif = profile.effectif as Reponses['effectif']
    }
  }

  return (
    <DiagnosticPageClient
      paysActifs={paysActifs}
      profileReponses={profileReponses}
    />
  )
}
