import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSolde } from '@/lib/credits'
import MontageClient from './MontageClient'
import type { DocumentsRequisGeneration, DocumentEntreprise, TypeDocumentEntreprise, PackDossier } from '@/types/dossier'
import type { Dispositif, Diagnostic, Profile } from '@/types'

export default async function MonteDossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ dispositifId: string }>
  searchParams: Promise<{ diagnosticId?: string }>
}) {
  const { dispositifId } = await params
  const { diagnosticId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [
    { data: dispositif },
    { data: profile },
    { data: packs },
    { data: documents },
    diagnosticResult,
  ] = await Promise.all([
    supabase.from('dispositifs').select('*').eq('id', dispositifId).eq('actif', true).single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('packs_dossiers').select('*').eq('actif', true).order('ordre'),
    supabase.from('documents_entreprise').select('*').eq('user_id', user.id),
    diagnosticId
      ? supabase.from('diagnostics').select('*').eq('id', diagnosticId).eq('user_id', user.id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!dispositif) notFound()

  const solde = await getSolde(user.id)

  const documentsMap = Object.fromEntries(
    (documents ?? []).map((d) => [d.type_document, d])
  ) as Record<TypeDocumentEntreprise, DocumentEntreprise>

  return (
    <MontageClient
      dispositif={dispositif as Dispositif & { documents_requis_generation: DocumentsRequisGeneration }}
      diagnosticId={diagnosticId ?? null}
      soldeInitial={solde}
      packs={(packs ?? []) as PackDossier[]}
      documentsExistants={documentsMap}
      profile={profile as Profile}
      diagnostic={(diagnosticResult.data ?? null) as Diagnostic | null}
    />
  )
}
