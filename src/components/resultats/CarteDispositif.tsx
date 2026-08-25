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

export default function CarteDispositif({ resultat }: Props) {
  const d = resultat.dispositif!
  const devise = d.devise ?? 'MAD'
  const score = resultat.score
  const nonEligible = resultat.statut === 'non_eligible'

  const matchBg    = score >= 80 ? '#EAF3EE' : score >= 60 ? '#FFF1E7' : '#F1EEE9'
  const matchColor = score >= 80 ? '#1F5A44' : score >= 60 ? '#B8552A' : '#8A8378'

  const montant = d.montant_max
    ? formatMontant(d.montant_max, devise)
    : d.taux ? `Jusqu'à ${d.taux}% du projet` : 'Variable'

  const nature = LABELS.type_aide?.[d.type_aide] ?? d.type_aide
  const catalogueHref = `/tableau-de-bord/catalogue?aide=${d.slug ?? d.id}`

  const validCount = resultat.criteres_ok?.length ?? 0
  const checkCount = resultat.criteres_manquants?.length ?? 0
  const docsCount = d.docs_parcours?.length ?? 0
  const stepsCount = d.depot_steps?.length ?? 0

  return (
    <div style={{
      background: '#fff', border: '1px solid #E7E1D9', borderRadius: 18,
      padding: '26px 28px',
      opacity: nonEligible ? 0.6 : 1,
    }}>

      {/* Nom + opérateur + badge match */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 21, lineHeight: 1.25, letterSpacing: '-0.01em' }}>{d.nom}</div>
          {d.organisme && (
            <div style={{ fontSize: 14, color: '#8A8378', marginTop: 5, lineHeight: 1.4 }}>{d.organisme}</div>
          )}
        </div>
        <div style={{ background: matchBg, color: matchColor, fontSize: 13, fontWeight: 700, padding: '6px 13px', borderRadius: 100, flexShrink: 0 }}>
          {score}% match
        </div>
      </div>

      {/* Ligne de chiffres */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>{montant}</span>
        <span style={{ fontSize: 13.5, color: '#8A8378' }}>· {nature}{d.delai_indicatif ? ` · ${d.delai_indicatif}` : ''}</span>
      </div>

      {/* Résumé d'éligibilité */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7FAF8', border: '1px solid #DCE9E2', borderRadius: 10, padding: '10px 13px', fontSize: 13.5, color: '#1F5A44', fontWeight: 600 }}>
          ✓ {validCount} critère{validCount !== 1 ? 's' : ''} validé{validCount !== 1 ? 's' : ''} par votre diagnostic
        </div>
        {checkCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF6EF', border: '1px solid #F3D8C2', borderRadius: 10, padding: '10px 13px', fontSize: 13.5, color: '#B8552A', fontWeight: 600 }}>
            ◐ {checkCount} à confirmer de votre côté
          </div>
        )}
      </div>

      {/* Séparateur + actions */}
      <div style={{ borderTop: '1px solid #E7E1D9', paddingTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <a
          href={catalogueHref}
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14.5, background: '#1F5A44', color: '#FAF8F5', borderRadius: 10, padding: '13px 22px', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Voir la fiche du dispositif →
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed #C9BFAE', borderRadius: 10, padding: '9px 13px' }}>
          <span style={{ fontSize: 13, color: '#6B6560' }}>{docsCount} pièces · {stepsCount} étapes de dépôt</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8A8378', background: '#F1EEE9', border: '1px solid #E7E1D9', padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap' }}>Prochainement</span>
        </div>
      </div>
    </div>
  )
}
