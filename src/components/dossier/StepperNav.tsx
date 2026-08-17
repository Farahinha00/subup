'use client'

type StatutEtape = 'validee' | 'en_cours' | 'a_faire'

interface StepInfo {
  titre: string
  statut: StatutEtape
}

interface Props {
  etapeActive: 1 | 2 | 3
  etapes: [StepInfo, StepInfo, StepInfo]
  onNavigate: (n: 1 | 2 | 3) => void
}

const LABELS_STATUT: Record<StatutEtape, string> = {
  validee: 'Validée',
  en_cours: 'En cours',
  a_faire: 'À faire',
}

export default function StepperNav({ etapeActive, etapes, onNavigate }: Props) {
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 36 }}>
      {etapes.map((e, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const isActive = n === etapeActive
        const isValidee = e.statut === 'validee'
        const isClickable = isValidee || n <= etapeActive

        return (
          <button
            key={n}
            onClick={() => isClickable && onNavigate(n)}
            aria-current={isActive ? 'step' : undefined}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', borderRadius: 12, border: '1px solid',
              borderColor: isActive ? '#1F5A44' : '#E7E1D9',
              background: isActive ? '#EAF3EE' : '#fff',
              cursor: isClickable ? 'pointer' : 'default',
              textAlign: 'left', marginRight: i < 2 ? 8 : 0,
            }}>
            {/* Pastille */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: isValidee ? '#1F5A44' : isActive ? '#fff' : '#F1EEE9',
              border: isValidee ? 'none' : isActive ? '2px solid #1F5A44' : '2px solid #C9BFAE',
              color: isValidee ? '#fff' : isActive ? '#1F5A44' : '#8A8378',
            }}>
              {isValidee ? '✓' : n}
            </div>
            {/* Texte */}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: isActive ? '#221F1D' : '#6B6560', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.titre}
              </div>
              <div style={{ fontSize: 11.5, color: isValidee ? '#1F5A44' : isActive ? '#E2703A' : '#8A8378', fontWeight: 600 }}>
                {LABELS_STATUT[e.statut]}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
