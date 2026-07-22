import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPaysActifs } from '@/lib/config'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/tableau-de-bord')

  const [
    paysActifs,
    { data: demandes },
    { data: utilisateurs },
    { data: dispositifs },
    { count: totalDiagnostics },
    { count: totalDemandes },
    { count: nouvellesDemandes },
  ] = await Promise.all([
    getPaysActifs(),
    supabase
      .from('demandes_accompagnement')
      .select('*, profile:profiles(prenom, nom, entreprise, email:id), dispositif:dispositifs(nom, slug)')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*, diagnostics(count)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('dispositifs')
      .select('id, slug, nom, organisme, type_aide, categorie, pays, actif, guichet_ouvert')
      .order('pays', { ascending: true })
      .order('categorie', { ascending: true }),
    supabase.from('diagnostics').select('*', { count: 'exact', head: true }),
    supabase.from('demandes_accompagnement').select('*', { count: 'exact', head: true }),
    supabase.from('demandes_accompagnement').select('*', { count: 'exact', head: true }).eq('statut', 'nouvelle'),
  ])

  return (
    <AdminClient
      demandes={demandes ?? []}
      utilisateurs={utilisateurs ?? []}
      dispositifs={dispositifs ?? []}
      paysActifs={paysActifs}
      stats={{
        totalUtilisateurs: utilisateurs?.length ?? 0,
        totalDiagnostics: totalDiagnostics ?? 0,
        totalDemandes: totalDemandes ?? 0,
        nouvellesDemandes: nouvellesDemandes ?? 0,
      }}
    />
  )
}
