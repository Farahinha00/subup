'use client'

interface Props {
  etapeActive: 1 | 2 | 3
  etapeComplete: boolean
  stepsValidated: number[]
  onPrecedent: () => void
  onValider: () => void
}

const LABELS_BOUTON = {
  1: "Valider l'éligibilité",
  2: 'Valider les documents',
  3: 'Clôturer le dossier',
}

const LABELS_ETAT = {
  1: 'Confirmez chaque critère pour continuer',
  2: 'Cochez tous les documents pour continuer',
  3: 'Cochez toutes les étapes pour finaliser',
}

const LABELS_ETAT_OK = {
  1: 'Éligibilité confirmée',
  2: 'Documents prêts',
  3: 'Dossier complet',
}

export default function BarreValidation({ etapeActive, etapeComplete, stepsValidated, onPrecedent, onValider }: Props) {
  const toutValide = stepsValidated.length === 3

  if (toutValide) {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#1F5A44', borderTop: '1px solid #1F5A44',
        boxShadow: '0 -4px 24px rgba(31,90,68,0.18)',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
            Les 3 étapes sont validées 🎉
          </span>
          <button
            style={{
              padding: '12px 24px', borderRadius: 11, fontSize: 14, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif", background: '#E2703A', color: '#fff', border: 'none', cursor: 'pointer',
            }}>
            Télécharger le dossier complet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(250,248,245,0.96)', backdropFilter: 'blur(10px)',
      borderTop: '1px solid #E7E1D9',
      boxShadow: '0 -4px 24px rgba(34,31,29,0.06)',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {/* Gauche : état + numéro */}
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: etapeComplete ? '#1F5A44' : '#6B6560' }}>
            {etapeComplete ? LABELS_ETAT_OK[etapeActive] : LABELS_ETAT[etapeActive]}
          </div>
          <div style={{ fontSize: 12, color: '#8A8378', marginTop: 2 }}>
            Étape {etapeActive} sur 3
          </div>
        </div>

        {/* Droite : boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {etapeActive > 1 && (
            <button
              onClick={onPrecedent}
              style={{
                padding: '10px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                background: 'none', border: '1px solid #C9BFAE', color: '#6B6560', cursor: 'pointer',
              }}>
              ← Précédent
            </button>
          )}
          <button
            onClick={etapeComplete ? onValider : undefined}
            disabled={!etapeComplete}
            aria-disabled={!etapeComplete}
            aria-label={!etapeComplete ? `${LABELS_BOUTON[etapeActive]} — complétez tous les éléments d'abord` : LABELS_BOUTON[etapeActive]}
            style={{
              padding: '10px 22px', borderRadius: 9, fontSize: 13.5, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif", border: 'none',
              background: etapeComplete ? '#1F5A44' : '#C9BFAE',
              color: '#fff',
              cursor: etapeComplete ? 'pointer' : 'not-allowed',
            }}>
            {LABELS_BOUTON[etapeActive]}
          </button>
        </div>
      </div>
    </div>
  )
}
