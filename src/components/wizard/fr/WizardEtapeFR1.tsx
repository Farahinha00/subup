'use client'

import type { Reponses, FormeJuridiqueFR, TrancheEffectifFR, TrancheCAEUR, SituationPersonnelle } from '@/types'
import { LABELS } from '@/lib/labels'

interface Props {
  reponses: Reponses
  onChange: (champ: keyof Reponses, valeur: unknown) => void
}

function RadioCard({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`radio-card text-left${selected ? ' radio-card-active' : ''}`}>
      <span className="text-sm">{label}</span>
    </button>
  )
}

export default function WizardEtapeFR1({ reponses, onChange }: Props) {
  const anneeActuelle = new Date().getFullYear()

  // La question situation personnelle est pertinente pour les créateurs / < 1 an
  const isCreateur = !reponses.annee_creation || reponses.annee_creation >= anneeActuelle - 1
    || reponses.forme_juridique_fr === 'micro' || reponses.forme_juridique_fr === 'EI'

  return (
    <div className="space-y-8">
      <div>
        <p className="label mb-3">1. Forme juridique de votre entreprise</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(LABELS.forme_juridique_fr) as [FormeJuridiqueFR, string][]).map(([k, v]) => (
            <RadioCard key={k} selected={reponses.forme_juridique_fr === k} label={v}
              onClick={() => onChange('forme_juridique_fr', k)} />
          ))}
        </div>
      </div>

      <div>
        <p className="label mb-3">2. Régime fiscal de l'entreprise</p>
        <div className="grid grid-cols-1 gap-2">
          {(Object.entries(LABELS.regime_fiscal) as [string, string][]).map(([k, v]) => (
            <RadioCard key={k} selected={reponses.regime_fiscal === k} label={v}
              onClick={() => onChange('regime_fiscal', k)} />
          ))}
        </div>
      </div>

      <div>
        <p className="label mb-2">3. Année de création (ou de création prévue)</p>
        <input
          type="number"
          min={1900}
          max={anneeActuelle + 1}
          placeholder={String(anneeActuelle)}
          value={reponses.annee_creation ?? ''}
          onChange={(e) => {
            const v = parseInt(e.target.value)
            if (!isNaN(v) && v >= 1900 && v <= anneeActuelle + 1) onChange('annee_creation', v)
          }}
          className="input w-36"
        />
        <p className="text-xs text-ardoise-clair mt-1">
          Indiquez l'année d'immatriculation au RCS, ou l'année prévue si en cours de création.
        </p>
      </div>

      {isCreateur && (
        <div>
          <p className="label mb-1">4. Votre situation personnelle au moment de la création</p>
          <p className="text-xs text-ardoise-clair mb-3">Certaines aides (ACRE, ARCE, NACRE) dépendent de votre statut.</p>
          <div className="grid grid-cols-1 gap-2">
            {(Object.entries(LABELS.situation_personnelle) as [SituationPersonnelle, string][]).map(([k, v]) => (
              <RadioCard key={k} selected={reponses.situation_personnelle === k} label={v}
                onClick={() => onChange('situation_personnelle', k)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="label mb-3">{isCreateur ? '5' : '4'}. Effectif actuel (ETP)</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(LABELS.effectif_fr) as [TrancheEffectifFR, string][]).map(([k, v]) => (
            <RadioCard key={k} selected={reponses.effectif === k} label={v}
              onClick={() => onChange('effectif', k)} />
          ))}
        </div>
      </div>

      <div>
        <p className="label mb-3">{isCreateur ? '6' : '5'}. Chiffre d'affaires annuel (dernier exercice clos)</p>
        <div className="grid grid-cols-1 gap-2">
          {(Object.entries(LABELS.ca_annuel_eur) as [TrancheCAEUR, string][]).map(([k, v]) => (
            <RadioCard key={k} selected={reponses.ca_annuel === k} label={v}
              onClick={() => onChange('ca_annuel', k)} />
          ))}
        </div>
        <p className="text-xs text-ardoise-clair mt-2">
          Pour une entreprise en création, indiquez votre CA prévisionnel première année.
        </p>
      </div>

      <div>
        <p className="label mb-3">{isCreateur ? '7' : '6'}. Région du siège social</p>
        <select
          className="input"
          value={reponses.region_fr ?? ''}
          onChange={(e) => onChange('region_fr', e.target.value || undefined)}
        >
          <option value="">Sélectionnez une région</option>
          {LABELS.region_fr.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
