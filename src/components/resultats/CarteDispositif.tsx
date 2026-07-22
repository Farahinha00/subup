'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Resultat } from '@/types'
import { LABELS } from '@/lib/labels'

interface Props {
  resultat: Resultat
  onDemandeAccompagnement: (dispositifId: string) => void
  demandeEnvoyee: boolean
  loadingDemande?: string | null
  diagnosticId?: string
}

function formatMontant(montant: number, devise: string): string {
  if (montant >= 1_000_000) {
    const m = montant / 1_000_000
    return `Jusqu'à ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} M ${devise}`
  }
  if (montant >= 1_000) return `Jusqu'à ${Math.round(montant / 1_000)} K ${devise}`
  return `Jusqu'à ${montant} ${devise}`
}

export default function CarteDispositif({ resultat, onDemandeAccompagnement, demandeEnvoyee, loadingDemande, diagnosticId }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const d = resultat.dispositif!
  const devise = d.devise ?? 'MAD'
  const score = resultat.score

  // Couleurs par score
  const matchBg    = score >= 80 ? '#EAF3EE' : score >= 60 ? '#FFF1E7' : '#F1EEE9'
  const matchColor = score >= 80 ? '#1F5A44' : score >= 60 ? '#B8552A' : '#8A8378'
  const barColor   = score >= 80 ? '#1F5A44' : score >= 60 ? '#E2703A' : '#C9BFAE'

  const montant = d.montant_max
    ? formatMontant(d.montant_max, devise)
    : d.taux ? `Jusqu'à ${d.taux}% du projet` : 'Variable'

  const subtitle = [
    LABELS.type_aide?.[d.type_aide] ?? d.type_aide,
    d.organisme,
  ].filter(Boolean).join(' · ')

  const guichetFerme = d.guichet_ouvert === false
  const isLoading = loadingDemande === d.id

  return (
    <div style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 18, padding: '28px 30px', overflow: 'hidden' }}>

      {/* Guichet fermé */}
      {guichetFerme && (
        <div style={{ background: '#FFF6EF', border: '1px solid #F3D8C2', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, color: '#7A4A2E', marginBottom: 16 }}>
          {d.prochaine_echeance
            ? `Prochaine vague : ${new Date(d.prochaine_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
            : 'Fonctionne par appels à projets'}
        </div>
      )}

      {/* ── Ligne 1 : nom + badge ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19 }}>{d.nom}</div>
          <div style={{ fontSize: 13.5, color: '#8A8378', marginTop: 3 }}>{subtitle}</div>
        </div>
        <div style={{ background: matchBg, color: matchColor, fontSize: 13, fontWeight: 700, padding: '6px 13px', borderRadius: 100, flexShrink: 0 }}>
          {score}% match
        </div>
      </div>

      {/* ── Barre de score ── */}
      <div style={{ height: 6, background: '#F1EEE9', borderRadius: 100, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${score}%`, background: barColor, borderRadius: 100 }} />
      </div>

      {/* ── 2 métriques ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#F1EEE9', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12.5, color: '#8A8378', marginBottom: 6 }}>Montant potentiel</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>{montant}</div>
        </div>
        <div style={{ background: '#F1EEE9', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12.5, color: '#8A8378', marginBottom: 6 }}>Délai indicatif</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>{d.delai_indicatif ?? 'Variable'}</div>
        </div>
      </div>

      {/* ── Résumé critères + toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 6 }}>
        {resultat.criteres_ok.length > 0 && (
          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1F5A44' }}>✓ {resultat.criteres_ok.length} validé{resultat.criteres_ok.length > 1 ? 's' : ''}</span>
        )}
        {resultat.criteres_manquants.length > 0 && (
          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#B8552A' }}>◐ {resultat.criteres_manquants.length} à vérifier</span>
        )}
        {resultat.criteres_bloquants.length > 0 && (
          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#8A8378' }}>✗ {resultat.criteres_bloquants.length} bloquant{resultat.criteres_bloquants.length > 1 ? 's' : ''}</span>
        )}
        <button
          onClick={() => setOuvert(!ouvert)}
          style={{ marginLeft: 'auto', fontSize: 13.5, fontWeight: 600, color: '#1F5A44', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {ouvert ? '▲ Masquer le détail' : '▼ Voir le détail'}
        </button>
      </div>

      {/* ── Section dépliable ── */}
      {ouvert && (
        <div style={{ borderTop: '1px solid #E7E1D9', marginTop: 16, paddingTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

          {/* Colonne gauche : critères */}
          <div>
            {resultat.criteres_ok.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1F5A44', marginBottom: 14 }}>
                  Critères validés
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 22 }}>
                  {resultat.criteres_ok.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 14, color: '#4A453F', lineHeight: 1.5 }}>
                      <span style={{ color: '#1F5A44', fontWeight: 700, flexShrink: 0 }}>✓</span>{c.label}
                    </div>
                  ))}
                </div>
              </>
            )}

            {resultat.criteres_manquants.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#B8552A', marginBottom: 14 }}>
                  À vérifier / compléter
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {resultat.criteres_manquants.map((c) => (
                    <div key={c.id}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 14, color: '#4A453F', lineHeight: 1.5 }}>
                        <span style={{ color: '#E2703A', fontWeight: 700, flexShrink: 0 }}>◐</span>{c.label}
                      </div>
                      {c.message_echec && (
                        <div style={{ fontSize: 13, color: '#8A8378', marginLeft: 19, marginTop: 2 }}>{c.message_echec}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {resultat.criteres_bloquants.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A8378', marginBottom: 14, marginTop: resultat.criteres_manquants.length > 0 ? 18 : 0 }}>
                  Critères bloquants
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {resultat.criteres_bloquants.map((c) => (
                    <div key={c.id}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 14, color: '#4A453F', lineHeight: 1.5 }}>
                        <span style={{ color: '#8A8378', fontWeight: 700, flexShrink: 0 }}>✗</span>{c.label}
                      </div>
                      {c.message_echec && (
                        <div style={{ fontSize: 13, color: '#8A8378', marginLeft: 19, marginTop: 2 }}>{c.message_echec}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Colonne droite : documents + CTA */}
          <div>
            {d.lien_officiel && (
              <a href={d.lien_officiel} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#1F5A44', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 16, textDecoration: 'none' }}>
                ↗ Site officiel {d.organisme}
              </a>
            )}

            {resultat.statut !== 'non_eligible' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {diagnosticId && (
                  <Link
                    href={`/tableau-de-bord/monter-dossier/${d.id}?diagnosticId=${diagnosticId}`}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600, fontSize: 14,
                      background: d.documents_requis_generation ? '#E2703A' : '#8A8378',
                      color: '#FAF8F5',
                      borderRadius: 10, padding: '12px 22px',
                      textDecoration: 'none', display: 'block', textAlign: 'center',
                      opacity: d.documents_requis_generation ? 1 : 0.7,
                    }}
                  >
                    {d.documents_requis_generation ? 'Monter le dossier assisté IA →' : 'Montage IA — bientôt disponible'}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
