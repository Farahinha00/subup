import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Diagnostic, Resultat } from '@/types'
import SupprimerBtn from './SupprimerBtn'

export default async function DiagnosticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: diagnostics } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const ids = (diagnostics ?? []).map((d: Diagnostic) => d.id)
  let countMap: Record<string, { total: number; eligibles: number }> = {}

  if (ids.length > 0) {
    const { data: resultats } = await supabase
      .from('resultats')
      .select('diagnostic_id, statut')
      .in('diagnostic_id', ids)
    for (const r of resultats ?? []) {
      if (!countMap[r.diagnostic_id]) countMap[r.diagnostic_id] = { total: 0, eligibles: 0 }
      countMap[r.diagnostic_id].total++
      if ((r as Resultat).statut !== 'non_eligible') countMap[r.diagnostic_id].eligibles++
    }
  }

  return (
    <div className="px-8 py-8 w-full max-w-3xl">

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-grotesk font-bold text-[22px] text-ardoise">Mes diagnostics</h1>
        <Link href="/diagnostic" className="btn-primary px-5 py-2 text-[13px]">
          + Nouveau diagnostic
        </Link>
      </div>

      {(diagnostics ?? []).length === 0 ? (
        <div className="card rounded-[16px] text-center py-12">
          <p className="text-[13px] text-ardoise-clair mb-4">Aucun diagnostic pour le moment</p>
          <Link href="/diagnostic" className="btn-primary px-5 py-2 text-[13px] inline-block">
            Faire mon premier diagnostic →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {(diagnostics as Diagnostic[]).map((diag) => {
            const counts = countMap[diag.id]
            const date = new Date(diag.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric',
            })

            return (
              <div
                key={diag.id}
                className="flex items-center gap-3 px-4 py-3 rounded-[12px] group transition-colors"
                style={{ backgroundColor: 'white', border: '1px solid var(--pierre)' }}
              >
                {/* Titre + date */}
                <Link
                  href={`/resultats/${diag.id}`}
                  className="flex-1 min-w-0 flex items-center gap-4 no-underline"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-grotesk font-semibold text-[14px] text-ardoise truncate">
                      {diag.titre ?? 'Diagnostic sans titre'}
                    </div>
                    <div className="text-[11px] text-ardoise-clair mt-0.5">{date}</div>
                  </div>

                  {/* Stats */}
                  {counts ? (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: counts.eligibles > 0 ? '#EAF3EE' : '#F1EEE9', color: counts.eligibles > 0 ? '#1F5A44' : '#8A8378' }}
                      >
                        {counts.eligibles} éligible{counts.eligibles > 1 ? 's' : ''}
                      </span>
                      <span className="text-[12px] text-ardoise-clair">{counts.total} analysés</span>
                    </div>
                  ) : (
                    <span className="text-[12px] text-ardoise-clair flex-shrink-0">Non analysé</span>
                  )}
                </Link>

                {/* Supprimer */}
                <SupprimerBtn diagnosticId={diag.id} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
