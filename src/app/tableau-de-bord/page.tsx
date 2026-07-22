import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LABELS } from '@/lib/labels'
import type { Diagnostic, Dispositif, Resultat, StatutResultat } from '@/types'
import type { StatutDossier } from '@/types/dossier'
import SupprimerDiagnostic from './SupprimerDiagnostic'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMontant(v: number, devise: string) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.0', '')}M ${devise}`
  if (v >= 1_000) return `${Math.round(v / 1_000)}K ${devise}`
  return `${v} ${devise}`
}

function initiales(prenom?: string | null, nom?: string | null, email?: string) {
  if (prenom && nom) return (prenom[0] + nom[0]).toUpperCase()
  if (prenom) return prenom.slice(0, 2).toUpperCase()
  return (email ?? 'U').slice(0, 2).toUpperCase()
}

function statutDossierMeta(statut: string): { label: string; color: string } {
  switch (statut) {
    case 'pret':               return { label: 'Prêt',        color: 'var(--vert)' }
    case 'generation_en_cours':return { label: 'En cours…',   color: 'var(--corail)' }
    case 'erreur':             return { label: 'Erreur',      color: '#C0392B' }
    default:                   return { label: 'En cours',    color: 'var(--ardoise-clair)' }
  }
}

function StatutBadge({ statut }: { statut: StatutResultat }) {
  if (statut === 'eligible')
    return <span className="text-[11px] font-semibold text-vert">Éligible</span>
  if (statut === 'probable')
    return <span className="text-[11px] font-semibold text-corail">Pièce manquante</span>
  return <span className="text-[11px] font-semibold text-ardoise-clair">Non éligible</span>
}

function ScoreBar({ score, statut }: { score: number; statut: StatutResultat }) {
  const color =
    statut === 'eligible' ? 'var(--vert)' :
    statut === 'probable' ? 'var(--corail)' :
    'var(--pierre)'
  return (
    <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'var(--pierre-clair)' }}>
      <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TableauDeBord() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: profile }, { data: diagnostics }, { data: dossiers }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('diagnostics').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('dossiers_generes').select('*, dispositif:dispositifs(id,nom,montant_max,devise)').eq('user_id', user.id).order('created_at', { ascending: false }),
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

  // Stats calculées
  const montantEstime = eligibles.reduce((sum, r) => {
    const d = r.dispositif as Dispositif | undefined
    return sum + (d?.montant_max ?? 0)
  }, 0)

  const dernierDiag = (diagnostics ?? [])[0] as Diagnostic | undefined
  const dernierResultats = dernierDiag ? (resultatsMap[dernierDiag.id] ?? []) : []
  const recommandes = dernierResultats.filter((r) => r.statut !== 'non_eligible')

  interface DossierRow {
    id: string
    diagnostic_id: string | null
    dispositif_id: string
    statut: StatutDossier
    created_at: string
    dispositif: { id: string; nom: string; montant_max: number | null; devise: string } | null
  }
  const tousLesDossiers = (dossiers ?? []) as DossierRow[]

  const prenom = profile?.prenom ?? user.email?.split('@')[0]
  const ini = initiales(profile?.prenom, profile?.nom, user.email)

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
        <div className="flex items-center gap-3">
          <Link href="/diagnostic" className="btn-primary px-5 py-2 text-[13px]">
            + Nouveau diagnostic
          </Link>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-grotesk font-bold text-[13px] flex-shrink-0"
            style={{ backgroundColor: 'var(--vert)', color: 'var(--fond)' }}
          >
            {ini}
          </div>
        </div>
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

      {/* ── Deux colonnes ── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>

        {/* Mes diagnostics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-grotesk font-semibold text-[15px] text-ardoise">Mes diagnostics</h2>
            <Link href="/diagnostic" className="text-[12px] font-semibold text-corail hover:text-corail-fonce transition">
              + Nouveau
            </Link>
          </div>

          {(diagnostics ?? []).length === 0 ? (
            <div className="card rounded-[16px] text-center py-12">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--pierre-clair)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="#8A8378" strokeWidth="1.8"/>
                  <path d="M16.5 16.5L21 21" stroke="#8A8378" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[13px] text-ardoise-clair mb-4">Aucun diagnostic pour le moment</p>
              <Link href="/diagnostic" className="btn-primary px-5 py-2 text-[13px] inline-block">
                Faire mon diagnostic →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(diagnostics as Diagnostic[]).map((diag) => {
                const results = resultatsMap[diag.id] ?? []
                const diagEligibles = results.filter((r) => r.statut !== 'non_eligible')
                const montantTotal = diagEligibles.reduce((sum, r) => {
                  const d = r.dispositif as Dispositif | undefined
                  return sum + (d?.montant_max ?? 0)
                }, 0)
                const totalOk = results.reduce((sum, r) => sum + r.criteres_ok.length, 0)
                const totalManquants = results.reduce((sum, r) => sum + r.criteres_manquants.length, 0)
                const devise = diag.pays === 'FR' ? 'EUR' : 'MAD'
                const dateLabel = new Date(diag.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

                return (
                  <div key={diag.id} className="card rounded-[16px] group">
                    {/* Titre + lien */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="font-grotesk font-bold text-[15px] text-ardoise leading-snug">
                          {diag.titre ?? 'Diagnostic d\'éligibilité'}
                        </div>
                        <div className="text-[11px] text-ardoise-clair mt-0.5">{dateLabel}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <SupprimerDiagnostic diagnosticId={diag.id} />
                        <Link
                          href={`/resultats/${diag.id}`}
                          className="text-[12px] font-semibold transition"
                          style={{ color: 'var(--corail)' }}
                        >
                          Voir →
                        </Link>
                      </div>
                    </div>

                    {/* Séparateur */}
                    <div style={{ height: 1, backgroundColor: 'var(--pierre)', marginBottom: 16 }} />

                    {/* Montant */}
                    <div className="text-[12px] text-ardoise-clair mb-1">Montant total estimé</div>
                    <div className="font-grotesk font-bold text-ardoise mb-4" style={{ fontSize: 28, lineHeight: 1.1 }}>
                      {montantTotal > 0 ? formatMontant(montantTotal, devise) : '—'}
                    </div>

                    {/* Critères */}
                    <div className="flex items-center gap-4">
                      {totalOk > 0 && (
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--vert)' }}>
                          ✓ {totalOk} critère{totalOk > 1 ? 's' : ''} validé{totalOk > 1 ? 's' : ''}
                        </span>
                      )}
                      {totalManquants > 0 && (
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--corail)' }}>
                          ◑ {totalManquants} à vérifier
                        </span>
                      )}
                      {results.length === 0 && (
                        <span className="text-[12px] text-ardoise-clair">Aucun résultat</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mes dossiers */}
        <div>
          <h2 className="font-grotesk font-semibold text-[15px] text-ardoise mb-4">Mes dossiers</h2>

          {tousLesDossiers.length === 0 ? (
            <div className="card rounded-[16px] text-center py-10">
              <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--pierre-clair)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7h18M3 12h18M3 17h10" stroke="#8A8378" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[13px] text-ardoise-clair mb-1">Aucun dossier pour le moment.</p>
              <p className="text-[12px] text-ardoise-clair">Démarrez un dossier depuis vos résultats.</p>
            </div>
          ) : (
            <div className="card rounded-[16px] p-0 overflow-hidden divide-y" style={{ borderColor: 'var(--pierre)' }}>
              {tousLesDossiers.slice(0, 8).map((dos) => {
                const d = dos.dispositif
                const href = `/tableau-de-bord/monter-dossier/${dos.dispositif_id}${dos.diagnostic_id ? `?diagnosticId=${dos.diagnostic_id}` : ''}`
                const { label: statutLabel, color: statutColor } = statutDossierMeta(dos.statut)
                return (
                  <Link
                    key={dos.id}
                    href={href}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors group"
                  >
                    {/* Icône statut */}
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px]"
                      style={{ backgroundColor: dos.statut === 'pret' ? 'var(--vert-pale)' : 'var(--pierre-clair)' }}>
                      {dos.statut === 'pret' ? '✓' : dos.statut === 'erreur' ? '!' : '↗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ardoise truncate group-hover:text-vert transition-colors">
                        {d?.nom ?? 'Dispositif'}
                      </div>
                      <div className="text-[11px] text-ardoise-clair">
                        {new Date(dos.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {d?.montant_max ? ` · ${formatMontant(d.montant_max, d.devise)}` : ''}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: statutColor }}>
                      {statutLabel}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
