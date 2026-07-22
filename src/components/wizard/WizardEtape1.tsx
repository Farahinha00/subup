'use client'

import { LABELS } from '@/lib/labels'
import type { Reponses } from '@/types'

interface Props {
  reponses: Partial<Reponses>
  onChange: (champ: keyof Reponses, valeur: unknown) => void
  onNext: () => void
}

function RadioCards({ name, options, value, onChange, cols = 1 }: {
  name: string
  options: { value: string; label: string }[]
  value: string | undefined
  onChange: (v: string) => void
  cols?: number
}) {
  return (
    <div className={`grid gap-2 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map((opt) => (
        <label key={opt.value} className={`radio-card ${value === opt.value ? 'radio-card-active' : ''}`}>
          <input type="radio" name={name} value={opt.value} checked={value === opt.value}
            onChange={() => onChange(opt.value)} className="accent-corail flex-shrink-0" />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

function BooleanToggle({ champ, value, onChange, labelOui, labelNon }: {
  champ: string; value: boolean | undefined; onChange: (v: boolean) => void
  labelOui: string; labelNon: string
}) {
  return (
    <div className="flex gap-2">
      {[{ v: true, l: labelOui }, { v: false, l: labelNon }].map(({ v, l }) => (
        <label key={String(v)} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium
          ${value === v ? 'border-corail bg-corail-pale text-corail-fonce' : 'border-gray-200 bg-white text-ardoise hover:border-gray-300'}`}>
          <input type="radio" name={champ} checked={value === v} onChange={() => onChange(v)} className="accent-corail" />
          {l}
        </label>
      ))}
    </div>
  )
}

export default function WizardEtape1({ reponses, onChange, onNext }: Props) {
  const ok = reponses.statut_juridique && reponses.annee_creation && reponses.secteur && reponses.region && reponses.effectif && reponses.ca_annuel && reponses.porteur_mre !== undefined

  return (
    <div className="space-y-7">
      <div>
        <label className="label">1. Statut juridique</label>
        <RadioCards name="statut_juridique"
          options={Object.entries(LABELS.statut_juridique).map(([v, l]) => ({ value: v, label: l }))}
          value={reponses.statut_juridique} onChange={(v) => onChange('statut_juridique', v)} />
      </div>

      <div>
        <label className="label">2. Année de création</label>
        <input type="number" min={1950} max={new Date().getFullYear()} placeholder="ex : 2019"
          value={reponses.annee_creation ?? ''} onChange={(e) => onChange('annee_creation', parseInt(e.target.value))}
          className="input max-w-xs" />
      </div>

      <div>
        <label className="label">3. Secteur d'activité</label>
        <RadioCards name="secteur" cols={2}
          options={Object.entries(LABELS.secteur).map(([v, l]) => ({ value: v, label: l }))}
          value={reponses.secteur} onChange={(v) => onChange('secteur', v)} />
      </div>

      <div>
        <label className="label">4. Région d'implantation</label>
        <select value={reponses.region ?? ''} onChange={(e) => onChange('region', e.target.value)} className="input">
          <option value="">Sélectionnez votre région...</option>
          {LABELS.region.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label className="label">5. Effectif actuel</label>
        <RadioCards name="effectif"
          options={Object.entries(LABELS.effectif).map(([v, l]) => ({ value: v, label: l }))}
          value={reponses.effectif} onChange={(v) => onChange('effectif', v)} />
      </div>

      <div>
        <label className="label">6. Chiffre d'affaires annuel</label>
        <RadioCards name="ca_annuel"
          options={Object.entries(LABELS.ca_annuel).map(([v, l]) => ({ value: v, label: l }))}
          value={reponses.ca_annuel} onChange={(v) => onChange('ca_annuel', v)} />
      </div>

      <div>
        <label className="label">7. Êtes-vous Marocain Résidant à l'Étranger (MRE) ?</label>
        <BooleanToggle champ="porteur_mre" value={reponses.porteur_mre}
          onChange={(v) => onChange('porteur_mre', v)}
          labelOui="Oui, je réside à l'étranger" labelNon="Non, je réside au Maroc" />
        <p className="text-xs text-gray-400 mt-2">Détermine l'accès aux programmes MRE (MDM Invest…).</p>
      </div>

      <button onClick={onNext} disabled={!ok} className="btn-primary w-full py-3 rounded-xl bg-corail hover:bg-corail-fonce text-white disabled:opacity-40 transition">
        Continuer — Étape 2 →
      </button>
    </div>
  )
}
