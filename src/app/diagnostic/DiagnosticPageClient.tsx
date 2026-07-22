'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProgressBar from '@/components/wizard/ProgressBar'
import WizardEtape1 from '@/components/wizard/WizardEtape1'
import WizardEtape2 from '@/components/wizard/WizardEtape2'
import WizardEtape3 from '@/components/wizard/WizardEtape3'
import WizardTextLibre from '@/components/wizard/WizardTextLibre'
import WizardRecapitulatif from '@/components/wizard/WizardRecapitulatif'
import WizardQuestionsManquantes from '@/components/wizard/WizardQuestionsManquantes'
import { getChampsAPoser, type ExtractionOutput } from '@/lib/wizard-questions'
import type { Pays, Reponses } from '@/types'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'subventions_diagnostic_draft'

type Mode = 'texte' | 'recap' | 'questions' | 'wizard' | 'titre' | 'mur'

const titreMode: Record<Mode, string> = {
  texte: 'Décrivez votre projet',
  recap: 'Ce que j\'ai compris',
  questions: 'Questions complémentaires',
  wizard: 'Diagnostic d\'éligibilité',
  titre: 'Nommez ce diagnostic',
  mur: '',
}

function DiagnosticInner({ paysActifs, profileReponses }: {
  paysActifs: Pays[]
  profileReponses: Partial<Reponses> | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [pays, setPays] = useState<Pays | null>(null)
  const [mode, setMode] = useState<Mode>('texte')
  const [etape, setEtape] = useState(1)
  const [reponses, setReponses] = useState<Partial<Reponses>>({})
  const [loading, setLoading] = useState(false)
  const [extraction, setExtraction] = useState<ExtractionOutput | null>(null)
  const [extractionErreur, setExtractionErreur] = useState<string | null>(null)
  const [champsAPoser, setChampsAPoser] = useState<(keyof Reponses)[]>([])
  const [descriptionProjet, setDescriptionProjet] = useState('')
  const [titre, setTitre] = useState('')

  const singlePays = paysActifs.length === 1

  useEffect(() => {
    const urlPays = searchParams.get('pays') as Pays | null
    const draft = localStorage.getItem(STORAGE_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as Partial<Reponses>
        const merged = profileReponses ? { ...profileReponses, ...parsed } : parsed
        setReponses(merged)
        if (merged.pays) {
          setPays(merged.pays)
          setMode(merged.statut_juridique || merged.type_projet ? 'wizard' : 'texte')
          return
        }
      } catch {}
    }
    if (profileReponses && Object.keys(profileReponses).length > 0) {
      setReponses(profileReponses)
    }
    if (singlePays) { choisirPays(paysActifs[0]); return }
    if (urlPays && paysActifs.includes(urlPays)) choisirPays(urlPays)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(champ: keyof Reponses, valeur: unknown) {
    setReponses((prev) => {
      const next = { ...prev, [champ]: valeur }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function choisirPays(p: Pays) {
    setPays(p); setEtape(1)
    const base = profileReponses ?? {}
    const next = { ...base, pays: p }
    setReponses(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setMode('texte')
  }

  async function handleAnalyser(texte: string) {
    setDescriptionProjet(texte)
    setLoading(true)
    setExtractionErreur(null)
    try {
      const res = await fetch('/api/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texte }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setExtractionErreur('Limite d\'analyses atteinte (5/heure). Répondez directement aux questions.')
        } else if (data.error === 'api_not_configured') {
          setExtractionErreur('Analyse automatique indisponible pour le moment.')
        } else {
          setExtractionErreur('L\'analyse automatique a rencontré une erreur.')
        }
        setLoading(false); return
      }
      const { extraction: ext } = await res.json() as { extraction: ExtractionOutput }
      setExtraction(ext)
      const preFilled: Partial<Reponses> = { pays: 'MA' }
      for (const [champ, field] of Object.entries(ext)) {
        if (field.confidence !== 'missing' && field.value !== null) {
          ;(preFilled as Record<string, unknown>)[champ] = field.value
        }
      }
      const merged = { ...reponses, ...preFilled }
      setReponses(merged)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      setMode('recap')
    } catch {
      setExtractionErreur('Connexion impossible. Vérifiez votre réseau.')
    } finally {
      setLoading(false)
    }
  }

  function handleWizardClassique() { setMode('wizard'); setEtape(1) }

  function handleRecapContinuer() {
    const champs = getChampsAPoser(reponses)
    setChampsAPoser(champs)
    if (champs.length === 0) setMode('titre')
    else setMode('questions')
  }

  async function handleSubmit() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { localStorage.setItem(STORAGE_KEY, JSON.stringify(reponses)); setLoading(false); setMode('mur'); return }
    await sauvegarderDiagnostic(user.id, reponses as Reponses)
  }

  async function sauvegarderDiagnostic(userId: string, rep: Reponses) {
    const supabase = createClient()
    const nbQuestionsAI = mode === 'titre' ? champsAPoser.length : undefined

    let titreFinal = titre.trim()
    if (!titreFinal) {
      try {
        const res = await fetch('/api/titre-diagnostic', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description_projet: descriptionProjet, reponses: rep }),
        })
        if (res.ok) {
          const data = await res.json() as { titre: string | null }
          titreFinal = data.titre ?? ''
        }
      } catch {}
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: diagnostic, error } = await supabase
      .from('diagnostics')
      .insert({
        user_id: userId, pays: rep.pays ?? 'MA', reponses: rep,
        ...(titreFinal && { titre: titreFinal }),
        ...(descriptionProjet && { description_projet: descriptionProjet }),
        ...(extraction && { extraction }),
        ...(nbQuestionsAI !== undefined && { nb_questions_posees: nbQuestionsAI }),
      } as any)
      .select().single()
    if (error || !diagnostic) { console.error(error); setLoading(false); return }
    const res = await fetch('/api/matching', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticId: diagnostic.id }),
    })
    if (res.ok) { localStorage.removeItem(STORAGE_KEY); router.push(`/resultats/${diagnostic.id}`) }
    else setLoading(false)
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (mode === 'mur') return <MurCapture />

  if (!pays) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="font-grotesk font-bold text-[28px] text-ardoise mb-2">
            Diagnostic d&apos;éligibilité
          </h1>
          <p className="text-ardoise-clair text-[15px]">Dans quel pays est implantée votre entreprise ?</p>
        </div>
        <div className="grid gap-4 grid-cols-1 max-w-xs mx-auto">
          {paysActifs.map((p) => (
            <button key={p} type="button" onClick={() => choisirPays(p)}
              className="card flex flex-col items-center gap-3 py-10 hover:border-corail transition-colors cursor-pointer group">
              <span className="text-4xl">🇲🇦</span>
              <span className="font-grotesk font-bold text-[17px] text-ardoise group-hover:text-corail transition-colors">Maroc</span>
              <span className="text-xs text-ardoise-clair text-center leading-relaxed">Intelaka, Tatwir, Innov Invest, Digital PME, Istitmar…</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const totalEtapes = 3

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* En-tête */}
      <div className="text-center mb-8">
        <h1 className="font-grotesk font-bold text-[24px] text-ardoise">
          {titreMode[mode]}
        </h1>
        <p className="text-ardoise-clair text-[14px] mt-1.5">
          {mode === 'texte' && 'Analysez votre projet en quelques secondes avec l\'IA'}
          {mode === 'wizard' && 'Répondez honnêtement pour obtenir des résultats précis'}
          {(mode === 'recap' || mode === 'questions') && 'Vérifiez et complétez les informations extraites'}
        </p>
      </div>

      {/* Card principale */}
      <div className="card rounded-[20px] p-6">
        {mode === 'texte' && (
          <WizardTextLibre
            onAnalyser={handleAnalyser}
            onWizardClassique={handleWizardClassique}
            loading={loading}
            erreur={extractionErreur}
          />
        )}

        {mode === 'recap' && extraction && (
          <WizardRecapitulatif
            extraction={extraction} reponses={reponses}
            onChange={handleChange} onContinuer={handleRecapContinuer} onBack={() => setMode('texte')}
          />
        )}

        {mode === 'questions' && (
          <WizardQuestionsManquantes
            champsAPoser={champsAPoser} reponses={reponses}
            onChange={handleChange} onSubmit={() => setMode('titre')} onBack={() => setMode('recap')} loading={loading}
          />
        )}

        {mode === 'wizard' && (
          <>
            <ProgressBar etape={etape} total={totalEtapes} />
            {etape === 1 && <WizardEtape1 reponses={reponses} onChange={handleChange} onNext={() => setEtape(2)} />}
            {etape === 2 && <WizardEtape2 reponses={reponses} onChange={handleChange} onNext={() => setEtape(3)} onBack={() => setEtape(1)} />}
            {etape === 3 && <WizardEtape3 reponses={reponses} onChange={handleChange} onSubmit={() => setMode('titre')} onBack={() => setEtape(2)} loading={false} />}
          </>
        )}

        {mode === 'titre' && (
          <div>
            <div className="mb-6">
              <h2 className="font-grotesk font-bold text-[18px] text-ardoise mb-1">
                Nommez ce diagnostic
              </h2>
              <p className="text-[13px] text-ardoise-clair">
                Optionnel — si vous laissez vide, un titre sera généré automatiquement.
              </p>
            </div>
            <input
              type="text"
              className="input mb-6"
              placeholder="Ex : Projet digital PME Casablanca, Lancement e-commerce 2025…"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
              autoFocus
              maxLength={80}
            />
            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--pierre)' }}>
              <button
                type="button"
                onClick={() => setMode(champsAPoser.length > 0 ? 'questions' : 'recap')}
                className="text-[13px] font-medium text-ardoise-clair hover:text-ardoise transition"
              >
                ← Retour
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary px-6 py-2.5 disabled:opacity-40"
              >
                {loading ? 'Analyse en cours…' : 'Lancer l\'analyse →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DiagnosticPageClient({ paysActifs, profileReponses }: {
  paysActifs: Pays[]
  profileReponses?: Partial<Reponses> | null
}) {
  return (
    <Suspense>
      <DiagnosticInner
        paysActifs={paysActifs}
        profileReponses={profileReponses ?? null}
      />
    </Suspense>
  )
}

function MurCapture() {
  const router = useRouter()
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="w-14 h-14 rounded-2xl bg-vert-pale flex items-center justify-center mx-auto mb-6">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#1F5A44" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="text-center mb-7">
        <h2 className="font-grotesk font-bold text-[24px] text-ardoise mb-2">Vos résultats sont prêts !</h2>
        <p className="text-ardoise-clair text-[14px] leading-relaxed">
          Créez votre compte gratuit pour voir votre score d&apos;éligibilité, les critères validés et les documents à préparer.
        </p>
      </div>
      <div className="card rounded-[16px] mb-6">
        <div className="font-grotesk font-semibold text-[14px] text-ardoise mb-3">Ce que vous allez voir :</div>
        <ul className="space-y-2.5">
          {[
            'Score d\'éligibilité pour chaque dispositif',
            'Critères validés ✓ et manquants ◐',
            'Documents à préparer pour votre dossier',
            'Montant potentiel de subvention estimé',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[13px] text-ardoise-moyen">
              <span className="text-vert font-bold flex-shrink-0 mt-0.5">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={() => router.push('/inscription?from=diagnostic')} className="btn-primary w-full py-3.5 text-[15px] mb-3">
        Créer mon compte gratuit →
      </button>
      <button onClick={() => router.push('/connexion?from=diagnostic')} className="w-full text-[13px] text-ardoise-clair hover:text-ardoise transition text-center">
        J&apos;ai déjà un compte — me connecter
      </button>
    </div>
  )
}
