'use client'

import { useState } from 'react'

const MIN_CHARS = 50
const MAX_CHARS = 2000

interface Props {
  onAnalyser: (texte: string) => void
  onWizardClassique: () => void
  loading: boolean
  erreur?: string | null
}

export default function WizardTextLibre({ onAnalyser, onWizardClassique, loading, erreur }: Props) {
  const [texte, setTexte] = useState('')
  const count = texte.length
  const ok = count >= MIN_CHARS && !loading

  return (
    <div className="space-y-5">
      <div>
        <p className="text-ardoise-clair text-[14px] leading-relaxed mb-4">
          Décrivez votre projet librement — notre IA pré-remplira le questionnaire pour vous.
          Vous vérifierez chaque réponse avant de continuer.
        </p>

        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Ex : Je suis en train de créer une salle de sport à Rabat, investissement d'environ 2 M de dirhams, je compte embaucher 5 personnes en CDI, j'ai 20% d'apport, je suis Marocain résidant en France depuis 10 ans…"
          rows={6}
          className="input w-full resize-none leading-relaxed text-sm"
          disabled={loading}
        />

        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${count < MIN_CHARS ? 'text-amber-500' : 'text-ardoise-clair'}`}>
            {count < MIN_CHARS
              ? `Encore ${MIN_CHARS - count} caractères minimum`
              : `${count} / ${MAX_CHARS}`}
          </span>
        </div>

        <button
          onClick={() => onAnalyser(texte)}
          disabled={!ok}
          className="btn-primary w-full py-3.5 mt-4"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analyse en cours…
              </span>
            : 'Analyser mon projet →'}
        </button>
      </div>

      {erreur && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          {erreur}{' '}
          <button onClick={onWizardClassique} className="underline font-medium">
            Répondre aux questions directement →
          </button>
        </div>
      )}

      <div className="pt-4 border-t border-pierre text-center">
        <button
          onClick={onWizardClassique}
          className="text-[13px] text-ardoise-clair hover:text-ardoise transition"
        >
          Préférez-vous répondre aux questions une par une ?
        </button>
      </div>

      <p className="text-xs text-ardoise-clair text-center">
        Votre texte est analysé automatiquement. Il n&apos;est pas partagé avec des tiers.
      </p>
    </div>
  )
}
