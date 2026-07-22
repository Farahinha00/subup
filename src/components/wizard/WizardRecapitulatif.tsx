'use client'

import { useState } from 'react'
import { LABELS } from '@/lib/labels'
import {
  WIZARD_QUESTIONS_MA,
  getDisplayLabel,
  type ExtractionOutput,
  type WizardQ,
  type EnumQ,
  type BooleanQ,
} from '@/lib/wizard-questions'
import type { Reponses } from '@/types'

interface Props {
  extraction: ExtractionOutput
  reponses: Partial<Reponses>
  onChange: (champ: keyof Reponses, valeur: unknown) => void
  onContinuer: () => void
  onBack: () => void
}

export default function WizardRecapitulatif({ extraction, reponses, onChange, onContinuer, onBack }: Props) {
  const [editingChamp, setEditingChamp] = useState<string | null>(null)

  const champsAffiches = WIZARD_QUESTIONS_MA.filter((q) => {
    const ex = extraction[q.champ]
    return ex && ex.confidence !== 'missing'
  })

  const nbManquants = WIZARD_QUESTIONS_MA.filter((q) => {
    const ex = extraction[q.champ]
    const condOk = !q.showCondition || q.showCondition(reponses)
    return condOk && (!ex || ex.confidence === 'missing')
  }).length

  function handleModifier(champ: string) {
    setEditingChamp(editingChamp === champ ? null : champ)
  }

  function handleChangeField(champ: keyof Reponses, val: unknown) {
    onChange(champ, val)
    setEditingChamp(null)
  }

  return (
    <div className="space-y-5">
      {/* Légende */}
      <div>
        <p className="text-ardoise-clair text-[14px] mb-3 leading-relaxed">
          Voici ce que j&apos;ai compris de votre description. Vérifiez et corrigez si besoin.
        </p>
        <div className="flex items-center gap-5 text-xs text-ardoise-clair">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-vert inline-block" />
            Certain
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            À confirmer
          </span>
        </div>
      </div>

      {/* Liste des champs extraits */}
      <div className="divide-y divide-pierre border border-pierre rounded-[14px] overflow-hidden">
        {champsAffiches.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-ardoise-clair">
            Aucun champ extrait — veuillez compléter le questionnaire.
          </div>
        )}

        {champsAffiches.map((q) => {
          const ex = extraction[q.champ]
          const isCertain = ex?.confidence === 'certain'
          const isEditing = editingChamp === q.champ
          const currentValue = reponses[q.champ]

          return (
            <div key={q.champ} className="px-4 py-3.5 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${isCertain ? 'bg-vert' : 'bg-amber-400'}`}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] text-ardoise-clair uppercase tracking-wide font-medium">
                      {q.questionLabel.replace(/^\d+\. /, '').replace(/^↳ /, '')}
                    </div>
                    <div className="text-sm font-semibold text-ardoise mt-0.5">
                      {getDisplayLabel(q.champ, currentValue)}
                      {!isCertain && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">à confirmer</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleModifier(q.champ)}
                  className="flex-shrink-0 text-xs font-medium text-ardoise-clair hover:text-corail transition mt-1"
                >
                  {isEditing ? 'Annuler' : 'Modifier'}
                </button>
              </div>

              {isEditing && (
                <div className="mt-3 pt-3 border-t border-pierre">
                  <QuestionInput q={q} reponses={reponses} onChange={handleChangeField} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {nbManquants > 0 && (
        <div className="bg-vert-pale border border-vert rounded-[10px] px-4 py-3 text-xs text-vert">
          Il reste <strong>{nbManquants} question{nbManquants > 1 ? 's' : ''}</strong> à compléter à l&apos;étape suivante.
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={onBack} className="btn-secondary flex-1 py-3">
          ← Retour
        </button>
        <button onClick={onContinuer} className="btn-primary flex-1 py-3">
          {nbManquants === 0
            ? 'Valider et voir mes résultats →'
            : `Continuer (${nbManquants} question${nbManquants > 1 ? 's' : ''}) →`}
        </button>
      </div>
    </div>
  )
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function RadioCards({ name, options, value, onChange, cols = 1 }: {
  name: string
  options: { value: string; label: string }[]
  value: string | undefined
  onChange: (v: string) => void
  cols?: 1 | 2
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
  champ: string; value: boolean | undefined
  onChange: (v: boolean) => void
  labelOui: string; labelNon: string
}) {
  return (
    <div className="flex gap-2">
      {[{ v: true, l: labelOui }, { v: false, l: labelNon }].map(({ v, l }) => (
        <label
          key={String(v)}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium
            ${value === v ? 'border-corail bg-corail-pale text-corail-fonce' : 'border-pierre bg-white text-ardoise hover:border-ardoise-clair'}`}
        >
          <input type="radio" name={champ} checked={value === v} onChange={() => onChange(v)} className="accent-corail" />
          {l}
        </label>
      ))}
    </div>
  )
}

function QuestionInput({ q, reponses, onChange }: {
  q: WizardQ
  reponses: Partial<Reponses>
  onChange: (champ: keyof Reponses, val: unknown) => void
}) {
  if (q.type === 'boolean') {
    const bq = q as BooleanQ
    return (
      <BooleanToggle
        champ={bq.champ}
        value={reponses[bq.champ] as boolean | undefined}
        onChange={(v) => onChange(bq.champ, v)}
        labelOui={bq.labelOui}
        labelNon={bq.labelNon}
      />
    )
  }

  if (q.type === 'year') {
    return (
      <input
        type="number" min={1950} max={new Date().getFullYear()} placeholder="ex : 2019"
        value={(reponses[q.champ] as number | undefined) ?? ''}
        onChange={(e) => onChange(q.champ, parseInt(e.target.value))}
        className="input max-w-xs"
      />
    )
  }

  const eq = q as EnumQ
  const l = LABELS as Record<string, unknown>
  const fieldLabels = l[eq.champ]

  if (eq.champ === 'region') {
    return (
      <select
        value={(reponses[eq.champ] as string | undefined) ?? ''}
        onChange={(e) => onChange(eq.champ, e.target.value)}
        className="input"
      >
        <option value="">Sélectionnez votre région...</option>
        {LABELS.region.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
    )
  }

  const options = (fieldLabels && typeof fieldLabels === 'object' && !Array.isArray(fieldLabels))
    ? Object.entries(fieldLabels as Record<string, string>).map(([v, label]) => ({ value: v, label }))
    : eq.options.map((v) => ({ value: v, label: v }))

  return (
    <RadioCards
      name={eq.champ} options={options}
      value={reponses[eq.champ] as string | undefined}
      onChange={(v) => onChange(eq.champ, v)}
      cols={eq.cols}
    />
  )
}
