'use client'

import type { Reponses, SituationAdmin } from '@/types'
import { LABELS } from '@/lib/labels'

interface Props {
  reponses: Reponses
  onChange: (champ: keyof Reponses, valeur: unknown) => void
}

function BooleanToggle({ value, onChange, labelOui, labelNon }: {
  value: boolean | undefined
  onChange: (v: boolean) => void
  labelOui: string
  labelNon: string
}) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${value === true ? 'bg-corail text-white border-corail' : 'bg-white text-ardoise border-gray-200 hover:border-corail-clair'}`}>
        {labelOui}
      </button>
      <button type="button" onClick={() => onChange(false)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${value === false ? 'bg-corail text-white border-corail' : 'bg-white text-ardoise border-gray-200 hover:border-corail-clair'}`}>
        {labelNon}
      </button>
    </div>
  )
}

export default function WizardEtapeFR3({ reponses, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <p className="label mb-3">12. Situation fiscale et sociale de votre entreprise</p>
        <div className="grid grid-cols-1 gap-2">
          {(Object.entries(LABELS.situation_administrative) as [SituationAdmin, string][]).map(([k, v]) => (
            <button key={k} type="button"
              onClick={() => onChange('situation_administrative', k)}
              className={`radio-card text-left${reponses.situation_administrative === k ? ' radio-card-active' : ''}`}>
              <span className="text-sm">{v}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-ardoise-clair mt-2">
          Les aides publiques exigent que l'entreprise soit à jour de ses obligations URSSAF, TVA, IS.
        </p>
      </div>

      <div>
        <p className="label mb-3">13. Avez-vous déjà bénéficié d'un CIR ou d'un CII sur un projet antérieur ?</p>
        <BooleanToggle value={reponses.deja_cir_cii}
          onChange={(v) => onChange('deja_cir_cii', v)}
          labelOui="Oui, CIR ou CII déjà déposé"
          labelNon="Non, premier dossier CIR/CII" />
        {reponses.deja_cir_cii === true && (
          <div className="mt-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl p-3 text-xs">
            Le CIR et le CII sont récurrents : vous pouvez les déposer chaque année. Assurez-vous simplement que les dépenses du nouveau projet ne se chevauchent pas avec celles déjà déclarées.
          </div>
        )}
      </div>

      <div>
        <p className="label mb-3">14. Avez-vous déjà reçu d'autres aides publiques (subventions, avances remboursables) pour ce projet ?</p>
        <BooleanToggle value={reponses.aide_anterieure}
          onChange={(v) => onChange('aide_anterieure', v)}
          labelOui="Oui, aides déjà obtenues"
          labelNon="Non, aucune aide pour ce projet" />
        <p className="text-xs text-ardoise-clair mt-2">
          Les aides d'État se cumulent dans certaines limites. Les règles de cumul varient selon le dispositif : notre conseiller vous précisera les plafonds applicables.
        </p>
      </div>
    </div>
  )
}
