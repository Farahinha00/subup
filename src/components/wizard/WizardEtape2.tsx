'use client'

import { LABELS } from '@/lib/labels'
import type { Reponses } from '@/types'

interface Props {
  reponses: Partial<Reponses>
  onChange: (champ: keyof Reponses, valeur: unknown) => void
  onNext: () => void
  onBack: () => void
}

function RadioCards({ name, options, value, onChange }: {
  name: string; options: { value: string; label: string }[]
  value: string | undefined; onChange: (v: string) => void
}) {
  return (
    <div className="grid gap-2">
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

export default function WizardEtape2({ reponses, onChange, onNext, onBack }: Props) {
  const showEmbauche  = !!reponses.emplois_prevus && reponses.emplois_prevus !== '0'
  const showEcologie  = reponses.secteur === 'industrie' || reponses.secteur === 'economie_verte'
  const showEHTC      = reponses.secteur === 'tourisme'

  const ok = reponses.type_projet && reponses.montant_projet && reponses.autofinancement_ok !== undefined && reponses.emplois_prevus
    && (!showEmbauche || reponses.embauche_prevue_ma !== undefined)
    && (!showEcologie || reponses.dimension_ecologique_ma !== undefined)
    && (!showEHTC    || reponses.ehtc_classe !== undefined)

  const handleEmploisChange = (v: string) => {
    onChange('emplois_prevus', v)
    if (v === '0') onChange('embauche_prevue_ma', undefined)
  }

  return (
    <div className="space-y-7">
      <div>
        <label className="label">8. Type de projet</label>
        <RadioCards name="type_projet"
          options={Object.entries(LABELS.type_projet).map(([v, l]) => ({ value: v, label: l }))}
          value={reponses.type_projet} onChange={(v) => onChange('type_projet', v)} />
      </div>

      {showEcologie && (
        <div>
          <label className="label">↳ Dimension environnementale du projet</label>
          <BooleanToggle champ="dimension_ecologique_ma" value={reponses.dimension_ecologique_ma}
            onChange={(v) => onChange('dimension_ecologique_ma', v)}
            labelOui="Oui — efficacité énergétique, décarbonation, technologies propres"
            labelNon="Non, pas de composante écologique" />
          <p className="text-xs text-gray-400 mt-2">Détermine l'accès à TATWIR Croissance Verte.</p>
        </div>
      )}

      {showEHTC && (
        <div>
          <label className="label">↳ Votre établissement est-il classé EHTC ?</label>
          <BooleanToggle champ="ehtc_classe" value={reponses.ehtc_classe}
            onChange={(v) => onChange('ehtc_classe', v)}
            labelOui="Oui — hôtel, riad ou maison d'hôtes avec classification officielle"
            labelNon="Non, pas encore classé" />
          <p className="text-xs text-gray-400 mt-2">Requis pour CAP HOSPITALITY (rénovation EHTC).</p>
        </div>
      )}

      <div>
        <label className="label">9. Montant estimé du projet</label>
        <RadioCards name="montant_projet"
          options={Object.entries(LABELS.montant_projet).map(([v, l]) => ({ value: v, label: l }))}
          value={reponses.montant_projet} onChange={(v) => onChange('montant_projet', v)} />
      </div>

      <div>
        <label className="label">10. Autofinancement ≥ 10% possible ?</label>
        <BooleanToggle champ="autofinancement_ok" value={reponses.autofinancement_ok}
          onChange={(v) => onChange('autofinancement_ok', v)}
          labelOui="Oui, je peux" labelNon="Non / je ne sais pas" />
        <p className="text-xs text-gray-400 mt-2">Requis pour la Charte TPME (10% minimum en fonds propres).</p>
      </div>

      <div>
        <label className="label">11. Emplois permanents (CDI) créés</label>
        <RadioCards name="emplois_prevus"
          options={Object.entries(LABELS.emplois_prevus).map(([v, l]) => ({ value: v, label: l }))}
          value={reponses.emplois_prevus} onChange={handleEmploisChange} />
      </div>

      {showEmbauche && (
        <div>
          <label className="label">12. Profil des embauches prévues dans les 12 mois</label>
          <RadioCards name="embauche_prevue_ma"
            options={Object.entries(LABELS.embauche_prevue_ma).map(([v, l]) => ({ value: v, label: l }))}
            value={reponses.embauche_prevue_ma} onChange={(v) => onChange('embauche_prevue_ma', v)} />
          <p className="text-xs text-gray-400 mt-2">Détermine l'accès aux aides ANAPEC (TAHFIZ, IDMAJ, TAEHIL, AWRASH 2).</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 py-3">← Retour</button>
        <button onClick={onNext} disabled={!ok} className="btn-primary flex-1 py-3 rounded-xl bg-corail hover:bg-corail-fonce text-white disabled:opacity-40 transition">
          Continuer →
        </button>
      </div>
    </div>
  )
}
