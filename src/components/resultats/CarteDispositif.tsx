'use client'

import { useState } from 'react'
import type { Resultat } from '@/types'
import { LABELS } from '@/lib/labels'

interface Props {
  resultat: Resultat
  isBeta: boolean
  solde?: number
  dispositifDebloque?: boolean
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

export default function CarteDispositif({ resultat, isBeta, solde = 0, dispositifDebloque = false, diagnosticId }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const d = resultat.dispositif!
  const devise = d.devise ?? 'MAD'
  const score = resultat.score
  const nonEligible = resultat.statut === 'non_eligible'

  const matchBg    = score >= 80 ? '#EAF3EE' : score >= 60 ? '#FFF1E7' : '#F1EEE9'
  const matchColor = score >= 80 ? '#1F5A44' : score >= 60 ? '#B8552A' : '#8A8378'
  const barColor   = score >= 80 ? '#1F5A44' : score >= 60 ? '#E2703A' : '#C9BFAE'

  const montant = d.montant_max
    ? formatMontant(d.montant_max, devise)
    : d.taux ? `Jusqu'à ${d.taux}% du projet` : 'Variable'

  const nature = LABELS.type_aide?.[d.type_aide] ?? d.type_aide
  const guichetFerme = d.guichet_ouvert === false

  return (
    <div style={{
      background: '#fff', border: '1px solid #E7E1D9', borderRadius: 18,
      padding: '28px 30px', overflow: 'hidden',
      opacity: nonEligible ? 0.6 : 1,
    }}>

      {/* Guichet fermé */}
      {guichetFerme && (
        <div style={{ background: '#FFF6EF', border: '1px solid #F3D8C2', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, color: '#7A4A2E', marginBottom: 16 }}>
          {d.prochaine_echeance
            ? `Prochaine vague : ${new Date(d.prochaine_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
            : 'Fonctionne par appels à projets'}
        </div>
      )}

      {/* ── Ligne 1 : nom + badge match ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19 }}>{d.nom}</div>
          {d.operateur && (
            <div style={{ fontSize: 13, color: '#8A8378', marginTop: 3 }}>{d.operateur}</div>
          )}
        </div>
        <div style={{ background: matchBg, color: matchColor, fontSize: 13, fontWeight: 700, padding: '6px 13px', borderRadius: 100, flexShrink: 0 }}>
          {score}% match
        </div>
      </div>

      {/* ── Barre de score ── */}
      <div style={{ height: 4, background: '#F1EEE9', borderRadius: 100, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${score}%`, background: barColor, borderRadius: 100 }} />
      </div>

      {/* ── Description courte ── */}
      {d.short_desc && (
        <p style={{ fontSize: 13.5, color: '#6B6560', lineHeight: 1.6, margin: '0 0 18px' }}>{d.short_desc}</p>
      )}

      {/* ── 3 tuiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Montant', value: montant },
          { label: 'Nature', value: nature },
          { label: 'Délai', value: d.delai_indicatif ?? 'Variable' },
        ].map((t) => (
          <div key={t.label} style={{ background: '#F1EEE9', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, color: '#8A8378', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.label}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* ── Toggle détail ── */}
      <button
        onClick={() => setOuvert(!ouvert)}
        style={{ fontSize: 13.5, fontWeight: 600, color: '#1F5A44', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: ouvert ? 0 : 20 }}
      >
        {ouvert ? '▲ Masquer le détail du dispositif' : '▼ Voir le détail du dispositif'}
      </button>

      {/* ── Section dépliable ── */}
      {ouvert && (
        <div style={{ borderTop: '1px solid #E7E1D9', marginTop: 16, paddingTop: 20 }}>

          {/* Description longue */}
          {d.long_desc && (
            <p style={{ fontSize: 14, color: '#4A453F', lineHeight: 1.7, marginBottom: 20 }}>{d.long_desc}</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

            {/* Points clés */}
            {d.key_facts && d.key_facts.length > 0 && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4A453F', marginBottom: 12 }}>Points clés</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {d.key_facts.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, fontSize: 13.5, color: '#4A453F', lineHeight: 1.5 }}>
                      <span style={{ color: '#1F5A44', fontWeight: 700, flexShrink: 0 }}>·</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions d'éligibilité depuis critères diagnostic */}
            <div>
              {resultat.criteres_ok.length > 0 && (
                <>
                  <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1F5A44', marginBottom: 10 }}>Critères validés</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {resultat.criteres_ok.map((c) => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: '#4A453F', lineHeight: 1.5 }}>
                        <span style={{ color: '#1F5A44', fontWeight: 700, flexShrink: 0 }}>✓</span>{c.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {resultat.criteres_manquants.length > 0 && (
                <>
                  <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#B8552A', marginBottom: 10 }}>À vérifier</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {resultat.criteres_manquants.map((c) => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: '#4A453F', lineHeight: 1.5 }}>
                        <span style={{ color: '#E2703A', fontWeight: 700, flexShrink: 0 }}>◐</span>{c.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lien officiel */}
          {d.lien_officiel && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E7E1D9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <a href={d.lien_officiel} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13.5, color: '#1F5A44', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                ↗ Source officielle
                {d.last_verified_at && (
                  <span style={{ fontWeight: 400, color: '#8A8378', fontSize: 12 }}>
                    — vérifiée le {new Date(d.last_verified_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── CTA Montage dossier (beta only) ── */}
      {isBeta && !nonEligible && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #E7E1D9' }}>
          {dispositifDebloque ? (
            <a href={`/dossier/${diagnosticId}/${d.id}`}
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                padding: '13px 0', borderRadius: 11, fontSize: 14, fontWeight: 700,
                background: '#E2703A', color: '#FAF8F5', textDecoration: 'none',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
              Reprendre le dossier →
            </a>
          ) : (
            <a href={`/deblocage/${diagnosticId}/${d.id}`}
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                padding: '13px 0', borderRadius: 11, fontSize: 14, fontWeight: 700,
                background: '#1F5A44', color: '#FAF8F5', textDecoration: 'none',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
              Monter le dossier · 1 crédit
            </a>
          )}
        </div>
      )}
    </div>
  )
}
