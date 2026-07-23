'use client'

import { LABELS } from '@/lib/labels'
import {
  WIZARD_QUESTIONS_MA,
  type WizardQ,
  type EnumQ,
  type BooleanQ,
} from '@/lib/wizard-questions'
import type { Reponses } from '@/types'

interface Props {
  champsAPoser: (keyof Reponses)[]
  reponses: Partial<Reponses>
  onChange: (champ: keyof Reponses, valeur: unknown) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
}

export default function WizardQuestionsManquantes({
  champsAPoser, reponses, onChange, onSubmit, onBack, loading,
}: Props) {
  const questionsVisibles = WIZARD_QUESTIONS_MA.filter((q) => {
    const dansLaListe = champsAPoser.includes(q.champ)
    const condOk = !q.showCondition || q.showCondition(reponses)
    return dansLaListe && condOk
  })

  const nbDone = questionsVisibles.filter((q) => reponses[q.champ] !== undefined).length
  const ok = nbDone === questionsVisibles.length

  const handleEmploisChange = (v: string) => {
    onChange('emplois_prevus', v)
    if (v === '0') onChange('embauche_prevue_ma', undefined)
  }

  return (
    <div className="space-y-7">
      {/* Barre de progression */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-pierre-clair rounded-full overflow-hidden">
          <div
            className="h-full bg-corail rounded-full transition-all duration-300"
            style={{ width: questionsVisibles.length === 0 ? '100%' : `${(nbDone / questionsVisibles.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-ardoise-clair flex-shrink-0">
          {nbDone} / {questionsVisibles.length}
        </span>
      </div>

      {questionsVisibles.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-full bg-vert-pale flex items-center justify-center mx-auto mb-3">
            <span className="text-vert font-bold">✓</span>
          </div>
          <p className="text-sm text-ardoise-clair">Toutes les informations ont été renseignées.</p>
        </div>
      ) : (
        questionsVisibles.map((q) => (
          <QuestionBlock
            key={q.champ} q={q} reponses={reponses}
            onChange={q.champ === 'emplois_prevus' ? (_champ: keyof Reponses, v: unknown) => handleEmploisChange(v as string) : onChange}
          />
        ))
      )}

      <div className="bg-vert-pale rounded-[10px] px-4 py-3.5 text-sm text-vert" style={{ border: '1px solid var(--vert-pale)' }}>
        Presque terminé — vos résultats personnalisés s&apos;affichent après création de votre compte gratuit.
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 py-3">
          ← Retour
        </button>
        <button
          onClick={onSubmit}
          disabled={!ok || loading}
          className="btn-primary flex-1 py-3 disabled:opacity-40"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Calcul…
              </span>
            : 'Voir mes résultats →'}
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

function QuestionBlock({ q, reponses, onChange }: {
  q: WizardQ
  reponses: Partial<Reponses>
  onChange: (champ: keyof Reponses, val: unknown) => void
}) {
  return (
    <div>
      <label className="label">{q.questionLabel}</label>

      {q.type === 'boolean' && (
        <BooleanToggle
          champ={q.champ}
          value={reponses[q.champ] as boolean | undefined}
          onChange={(v) => onChange(q.champ, v)}
          labelOui={(q as BooleanQ).labelOui}
          labelNon={(q as BooleanQ).labelNon}
        />
      )}

      {q.type === 'year' && (
        <input
          type="number" min={1950} max={new Date().getFullYear()} placeholder="ex : 2019"
          value={(reponses[q.champ] as number | undefined) ?? ''}
          onChange={(e) => onChange(q.champ, parseInt(e.target.value))}
          className="input max-w-xs"
        />
      )}

      {q.type === 'enum' && (() => {
        const eq = q as EnumQ
        const l = LABELS as Record<string, unknown>

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

        const fieldLabels = l[eq.champ]
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
      })()}

      {q.hint && <p className="text-xs text-ardoise-clair mt-2">{q.hint}</p>}
    </div>
  )
}
