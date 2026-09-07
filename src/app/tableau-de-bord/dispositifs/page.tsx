import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Dispositif } from '@/types'
import CatalogueClient from './CatalogueClient'

export default async function CataloguePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: dispositifs } = await supabase
    .from('dispositifs')
    .select('*')
    .eq('actif', true)
    .eq('pays', 'MA')
    .order('nom')

  return <CatalogueClient dispositifs={(dispositifs ?? []) as Dispositif[]} />
}
