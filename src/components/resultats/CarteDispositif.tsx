'use client'

import type { Resultat } from '@/types'
import { LABELS } from '@/lib/labels'

interface Props {
  resultat: Resultat
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

const BADGE_PROCHAINEMENT: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontWeight: 700,
  fontSize: 11.5,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: '#fff',
  border: '1px solid #E7E1D9',
  borderRadius: 100,
  padding: '3px 8px',
  color: '#8A8378',
}

export default function CarteDispositif({ resultat, diagnosticId }: Props) {
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
  const catalogueHref = `/tableau-de-bord/catalogue?aide=${d.slug ?? d.id}`

  return (
    <div style={{
      background: '#fff', border: '1px solid #E7E1D9', borderRadius: 18,
      padding: '24px 28px', overflow: 'hidden',
      opacity: nonEligible ? 0.6 : 1,
    }}>

      {/* ── Ligne nom + badge match ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19 }}>{d.nom}</div>
          {d.organisme && (
            <div style={{ fontSize: 13, color: '#8A8378', marginTop: 3 }}>{d.organisme}</div>
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

      {/* ── Ligne de chiffres ── */}
      <div style={{ fontSize: 13, color: '#6B6560', marginBottom: 20 }}>
        <span style={{ fontWeight: 600, color: '#4A453F' }}>{montant}</span>
        {' · '}
        <span>{nature}</span>
        {d.delai_indicatif && (
          <>
            {' · '}
            <span>{d.delai_indicatif}</span>
          </>
        )}
      </div>

      {/* ── Séparateur + actions ── */}
      <div style={{ borderTop: '1px solid #E7E1D9', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <a
          href={catalogueHref}
          style={{ fontSize: 13.5, fontWeight: 600, color: '#1F5A44', textDecoration: 'none' }}
        >
          Voir la fiche complète dans le catalogue →
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={BADGE_PROCHAINEMENT}>PROCHAINEMENT</span>
          <button
            disabled
            aria-label="Monter le dossier accompagné — disponible prochainement"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              padding: '9px 16px',
              borderRadius: 10,
              background: '#F1EEE9',
              color: '#A9A296',
              border: '1px dashed #C9BFAE',
              cursor: 'not-allowed',
            }}
          >
            Monter le dossier accompagné
          </button>
        </div>
      </div>
    </div>
  )
}
