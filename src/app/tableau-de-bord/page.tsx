import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LABELS } from '@/lib/labels'
import type { Diagnostic, Dispositif, Resultat, StatutResultat } from '@/types'

function formatMontant(v: number, devise: string) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.0', '')}M ${devise}`
  if (v >= 1_000) return `${Math.round(v / 1_000)}K ${devise}`
  return `${v} ${devise}`
}

function StatutBadge({ statut }: { statut: StatutResultat }) {
  if (statut === 'eligible')
    return <span className="text-[11px] font-semibold text-vert">Éligible</span>
  if (statut === 'probable')
    return <span className="text-[11px] font-semibold text-corail">Pièce manquante</span>
  return <span className="text-[11px] font-semibold text-ardoise-clair">Non éligible</span>
}

export default async function TableauDeBord() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: profile }, { data: diagnostics }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('diagnostics').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
  ])

  const diagnosticIds = (diagnostics ?? []).map((d: Diagnostic) => d.id)
  let resultatsMap: Record<string, Resultat[]> = {}

  if (diagnosticIds.length > 0) {
    const { data: resultats } = await supabase
      .from('resultats')
      .select('*, dispositif:dispositifs(id,nom,montant_max,devise,type_aide,organisme,prochaine_echeance)')
      .in('diagnostic_id', diagnosticIds)
      .order('score', { ascending: false })
    for (const r of resultats ?? []) {
      if (!resultatsMap[r.diagnostic_id]) resultatsMap[r.diagnostic_id] = []
      resultatsMap[r.diagnostic_id].push(r as Resultat)
    }
  }

  const allResultats = Object.values(resultatsMap).flat()
  const eligibles = allResultats.filter((r) => r.statut !== 'non_eligible')

  const montantEstime = eligibles.reduce((sum, r) => {
    const d = r.dispositif as Dispositif | undefined
    return sum + (d?.montant_max ?? 0)
  }, 0)

  const dernierDiag = (diagnostics ?? [])[0] as Diagnostic | undefined
  const dernierResultats = dernierDiag ? (resultatsMap[dernierDiag.id] ?? []) : []
  const recommandes = dernierResultats.filter((r) => r.statut !== 'non_eligible')

  const prenom = profile?.prenom ?? user.email?.split('@')[0]

  const stats = [
    {
      label: 'Financement estimé',
      value: montantEstime > 0 ? formatMontant(montantEstime, 'MAD') : '—',
      sub: eligibles.length > 0 ? `${eligibles.length} dispositif${eligibles.length > 1 ? 's' : ''} accessibles` : 'Lancez un diagnostic',
      subColor: 'text-ardoise-clair',
    },
    {
      label: 'Dispositifs recommandés',
      value: String(recommandes.length || '—'),
      sub: recommandes.length > 0 ? `${recommandes.filter(r => r.statut === 'eligible').length} éligibles` : 'Aucun diagnostic',
      subColor: recommandes.length > 0 ? 'text-corail' : 'text-ardoise-clair',
    },
    {
      label: 'Diagnostics réalisés',
      value: String((diagnostics ?? []).length),
      sub: dernierDiag
        ? `Dernier le ${new Date(dernierDiag.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
        : 'Aucun pour le moment',
      subColor: 'text-ardoise-clair',
    },
    {
      label: 'Dispositifs analysés',
      value: String(allResultats.length || '—'),
      sub: allResultats.length > 0 ? 'Tous diagnostics confondus' : 'Lancez un diagnostic',
      subColor: 'text-ardoise-clair',
    },
  ]

  return (
    <div className="px-8 py-8 w-full">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-grotesk font-bold text-[24px] text-ardoise">
            Bonjour, {prenom} 👋
          </h1>
          <p className="text-[13px] text-ardoise-clair mt-0.5">
            {profile?.entreprise ?? user.email}
            {dernierDiag?.reponses.secteur
              ? ` · ${LABELS.secteur[dernierDiag.reponses.secteur as keyof typeof LABELS.secteur]}`
              : ''}
          </p>
        </div>
        <Link
          href="/tableau-de-bord/diagnostics"
          className="text-[13px] font-semibold transition"
          style={{ color: 'var(--corail)' }}
        >
          Voir mes diagnostics →
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-3 mb-8 min-w-0">
        {stats.map((s) => (
          <div key={s.label} className="card rounded-[16px]">
            <div className="text-[11px] font-medium text-ardoise-clair uppercase tracking-wide mb-2">{s.label}</div>
            <div className="font-grotesk font-bold text-[26px] text-ardoise leading-none mb-1">{s.value}</div>
            <div className={`text-[12px] ${s.subColor}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Diagnostics récents ── */}
      {(diagnostics ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-grotesk font-semibold text-[14px] text-ardoise">Diagnostics récents</h2>
            <Link href="/tableau-de-bord/diagnostics" className="text-[12px] font-semibold" style={{ color: 'var(--corail)' }}>
              Voir tout →
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {(diagnostics as Diagnostic[]).map((diag) => {
              const results = resultatsMap[diag.id] ?? []
              const eligiblesCount = results.filter((r) => r.statut !== 'non_eligible').length
              const date = new Date(diag.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              return (
                <Link
                  key={diag.id}
                  href={`/resultats/${diag.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-[10px] transition-colors no-underline"
                  style={{ backgroundColor: 'white', border: '1px solid var(--pierre)' }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-grotesk font-semibold text-[13px] text-ardoise truncate block">
                      {diag.titre ?? 'Diagnostic sans titre'}
                    </span>
                  </div>
                  <span className="text-[11px] text-ardoise-clair flex-shrink-0">{date}</span>
                  {results.length > 0 && (
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: eligiblesCount > 0 ? '#EAF3EE' : '#F1EEE9', color: eligiblesCount > 0 ? '#1F5A44' : '#8A8378' }}
                    >
                      {eligiblesCount} éligible{eligiblesCount > 1 ? 's' : ''}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
