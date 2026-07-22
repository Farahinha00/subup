'use client'

import { LABELS } from '@/lib/labels'
import type { Reponses } from '@/types'

interface Props {
  reponses: Partial<Reponses>
  onChange: (champ: keyof Reponses, valeur: unknown) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
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

export default function WizardEtape3({ reponses, onChange, onSubmit, onBack, loading }: Props) {
  const ok = reponses.situation_administrative && reponses.aide_anterieure !== undefined && reponses.capital_independant !== undefined && reponses.pret_bancaire_ma !== undefined && reponses.besoin_conseil_at !== undefined

  return (
    <div className="space-y-7">
      <div>
        <label className="label">13. Situation fiscale et CNSS</label>
        <RadioCards name="situation_administrative"
          options={Object.entries(LABELS.situation_administrative).map(([v, l]) => ({ value: v, label: l }))}
          value={reponses.situation_administrative} onChange={(v) => onChange('situation_administrative', v)} />
        <p className="text-xs text-gray-400 mt-2">Une attestation DGI et CNSS est requise pour la plupart des dossiers.</p>
      </div>

      <div>
        <label className="label">14. Avez-vous déjà bénéficié d'une aide publique ?</label>
        <BooleanToggle champ="aide_anterieure" value={reponses.aide_anterieure}
          onChange={(v) => onChange('aide_anterieure', v)}
          labelOui="Oui, déjà bénéficié" labelNon="Non, première fois" />
      </div>

      <div>
        <label className="label">15. Indépendance capitalistique</label>
        <BooleanToggle champ="capital_independant" value={reponses.capital_independant}
          onChange={(v) => onChange('capital_independant', v)}
          labelOui="Oui, entreprise indépendante" labelNon="Non, filiale d'un groupe (CA > 200 M MAD)" />
        <p className="text-xs text-gray-400 mt-2">La Charte TPME exige qu'aucun grand groupe (CA &gt; 200 M MAD) ne détienne plus de 25% du capital.</p>
      </div>

      <div>
        <label className="label">16. Négociez-vous un prêt bancaire pour ce projet ?</label>
        <BooleanToggle champ="pret_bancaire_ma" value={reponses.pret_bancaire_ma}
          onChange={(v) => onChange('pret_bancaire_ma', v)}
          labelOui="Oui, démarche en cours avec ma banque" labelNon="Non, pas de financement bancaire prévu" />
        <p className="text-xs text-gray-400 mt-2">Détermine l'accès aux garanties Tamwilcom (INTELAKA, Damane Express, Damane Tamwin…).</p>
      </div>

      <div>
        <label className="label">17. Avez-vous besoin d'études ou d'expertise externe ?</label>
        <BooleanToggle champ="besoin_conseil_at" value={reponses.besoin_conseil_at}
          onChange={(v) => onChange('besoin_conseil_at', v)}
          labelOui="Oui — stratégie, qualité, organisation, SI…" labelNon="Non, pas de besoin de conseil" />
        <p className="text-xs text-gray-400 mt-2">Détermine l'accès à MOUSSANADA (prise en charge d'expertises jusqu'à 1 M MAD).</p>
      </div>

      <div className="bg-corail-pale rounded-xl p-4 text-sm text-corail-fonce" style={{ border: '1px solid rgba(226,112,58,0.2)' }}>
        Presque terminé — vos résultats personnalisés s'affichent après création de votre compte gratuit.
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 py-3">← Retour</button>
        <button onClick={onSubmit} disabled={!ok || loading}
          className="btn-primary flex-1 py-3 rounded-xl bg-corail hover:bg-corail-fonce text-white disabled:opacity-40 transition">
          {loading ? 'Calcul...' : 'Voir mes résultats →'}
        </button>
      </div>
    </div>
  )
}
