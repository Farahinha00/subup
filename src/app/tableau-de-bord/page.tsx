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
    supabase.from('diagnostics').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
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

    </div>
  )
}
