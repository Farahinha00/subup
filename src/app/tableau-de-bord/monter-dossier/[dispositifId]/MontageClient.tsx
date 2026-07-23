'use client'

import { useState, useCallback } from 'react'
import JSZip from 'jszip'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { evalCondition } from '@/lib/dossier/evalCondition'
import type {
  DocumentsRequisGeneration, DocumentEntreprise, TypeDocumentEntreprise,
  PackDossier, DossierContext, QuestionSpecifique, DocumentAGenerer,
} from '@/types/dossier'
import type { Dispositif, Diagnostic, Profile } from '@/types'

interface Props {
  dispositif: Dispositif & { documents_requis_generation: DocumentsRequisGeneration | null }
  diagnosticId: string | null
  soldeInitial: number
  packs: PackDossier[]
  documentsExistants: Record<TypeDocumentEntreprise, DocumentEntreprise>
  profile: Profile
  diagnostic: Diagnostic | null
}

type Etape = 'intro' | 'paiement' | 'coffre_fort' | 'questions' | 'docs_prep' | 'recap' | 'generation' | 'done'

export default function MontageClient({
  dispositif, diagnosticId, soldeInitial, packs, documentsExistants, profile, diagnostic,
}: Props) {
  const schema = dispositif.documents_requis_generation

  const [etape, setEtape] = useState<Etape>('intro')
  const [solde, setSolde] = useState(soldeInitial)

  // Coffre-fort : docs présents (peut être enrichi par upload inline)
  const [docsExistants, setDocsExistants] = useState<Partial<Record<TypeDocumentEntreprise, DocumentEntreprise>>>(documentsExistants)
  const [cfUploading, setCfUploading] = useState<TypeDocumentEntreprise | null>(null)

  // Questions générales
  const [questionsRep, setQuestionsRep] = useState<Record<string, unknown>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Docs à préparer
  const [docModes, setDocModes] = useState<Record<string, 'upload' | 'generer'>>(() => {
    const init: Record<string, 'upload' | 'generer'> = {}
    for (const doc of schema?.documents_a_generer ?? []) {
      if (doc.mode !== 'choix') init[doc.id] = doc.mode
    }
    return init
  })
  const [docFiles, setDocFiles] = useState<Record<string, File>>({})
  const [docContexte, setDocContexte] = useState<Record<string, Record<string, string>>>({})
  const [docUploading, setDocUploading] = useState<Record<string, boolean>>({})

  // Résultats
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [alerte, setAlerte] = useState<string | null>(null)

  // ── Dispositif sans schéma ────────────────────────────────────────────────────
  if (!schema) {
    return (
      <div className="px-8 py-8 w-full max-w-2xl">
        <BackLink diagnosticId={diagnosticId} />
        <div className="card p-8 text-center">
          <h2 className="font-grotesk font-bold text-[20px] text-ardoise mb-2">{dispositif.nom}</h2>
          <p className="text-[14px] text-ardoise-clair">Le montage assisté IA n&apos;est pas encore configuré pour ce dispositif.</p>
        </div>
      </div>
    )
  }

  // ── Contexte pour evalCondition ───────────────────────────────────────────────
  const ctx: DossierContext = {
    profile: profile as unknown as Record<string, unknown>,
    diagnostic: diagnostic ? { reponses: diagnostic.reponses as unknown as Record<string, unknown>, pays: diagnostic.pays } : null,
    coffre_fort: docsExistants as unknown as Record<string, DocumentEntreprise>,
    questions_specifiques: questionsRep,
    dispositif: dispositif as unknown as Record<string, unknown>,
  }

  const cfRequis = schema.coffre_fort_requis.filter((c) => evalCondition(c.condition, ctx))
  const questionsRequises = schema.questions_specifiques.filter((q) => evalCondition(q.condition, ctx))
  const docsAPrep = schema.documents_a_generer

  // ── Calcul validation depuis schéma ─────────────────────────────────────────
  function computeValidationErrors(answers: Record<string, unknown>): Record<string, string> {
    const errors: Record<string, string> = {}
    for (const doc of docsAPrep) {
      for (const v of (doc.validations ?? [])) {
        if (v.regle === 'coherence_montants') {
          const champ = v.config.champ as string
          const max = v.config.max as number
          const val = Number(answers[champ] ?? 0)
          if (val > 0 && val > max) {
            errors[champ] = (v.config.alerte as string).replace('{valeur}', String(val))
          }
        }
      }
    }
    return errors
  }

  // ── Completude steps ─────────────────────────────────────────────────────────
  const cfComplet = cfRequis.filter((c) => c.obligatoire).every((c) => !!docsExistants[c.type_document])
  const questionsCompletes = questionsRequises.filter((q) => q.obligatoire).every((q) => {
    const val = questionsRep[q.id]
    return val !== undefined && val !== null && val !== ''
  })
  const hasValidationErrors = Object.keys(validationErrors).length > 0
  const docsPreparesComplets = docsAPrep.every((doc) => {
    const m = docModes[doc.id]
    if (!m) return doc.mode !== 'choix'
    if (m === 'upload') return !!docFiles[doc.id]
    if (m === 'generer') {
      return (doc.questions_contexte ?? []).filter((q) => q.obligatoire).every((q) => {
        const val = docContexte[doc.id]?.[q.id]
        return val !== undefined && val !== ''
      })
    }
    return true
  })

  // ── Navigation entre steps ───────────────────────────────────────────────────
  const hasQuestions = questionsRequises.length > 0
  const hasDocsPrep = docsAPrep.length > 0

  function nextAfterCoffre(): Etape { return hasQuestions ? 'questions' : hasDocsPrep ? 'docs_prep' : 'recap' }
  function nextAfterQuestions(): Etape { return hasDocsPrep ? 'docs_prep' : 'recap' }
  function prevBeforeRecap(): Etape { return hasDocsPrep ? 'docs_prep' : hasQuestions ? 'questions' : 'coffre_fort' }

  // ── Upload coffre-fort inline ─────────────────────────────────────────────────
  async function uploadCoffreFort(type: TypeDocumentEntreprise, file: File) {
    if (file.size > 5 * 1024 * 1024) { setErreur('Fichier trop volumineux (max 5 Mo)'); return }
    setCfUploading(type)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCfUploading(null); return }
    const path = `${user.id}/${type}/${file.name}`
    const { data: upload, error: uploadErr } = await supabase.storage
      .from('documents-entreprise').upload(path, file, { upsert: true })
    const fichier_url = upload
      ? supabase.storage.from('documents-entreprise').getPublicUrl(path).data.publicUrl
      : null
    if (uploadErr) console.warn('Upload storage:', uploadErr.message)
    const { data } = await supabase.from('documents_entreprise').upsert({
      user_id: user.id, type_document: type, source: 'upload',
      fichier_url, fichier_nom: file.name,
      donnees_extraites: null, donnees_manuelles: null, statut: 'valide',
    }, { onConflict: 'user_id,type_document' }).select().single()
    if (data) setDocsExistants((prev) => ({ ...prev, [type]: data as DocumentEntreprise }))
    setCfUploading(null)
  }

  // ── Upload doc à préparer ────────────────────────────────────────────────────
  async function uploadDocPrep(doc: DocumentAGenerer, file: File) {
    if (file.size > 5 * 1024 * 1024) { setErreur('Fichier trop volumineux (max 5 Mo)'); return }
    setDocUploading((prev) => ({ ...prev, [doc.id]: true }))
    setDocFiles((prev) => ({ ...prev, [doc.id]: file }))
    setDocUploading((prev) => ({ ...prev, [doc.id]: false }))
  }

  // ── Paiement ─────────────────────────────────────────────────────────────────
  async function handleAchat(packId: string) {
    setLoading(true); setErreur(null)
    try {
      const res = await fetch('/api/paiement', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json() as { nb_dossiers: number }
      setSolde((s) => s + data.nb_dossiers)
      setEtape('coffre_fort')
    } catch { setErreur('Erreur de paiement. Réessayez.') }
    finally { setLoading(false) }
  }

  // ── Génération ───────────────────────────────────────────────────────────────
  async function handleGenerer() {
    setLoading(true); setErreur(null); setAlerte(null); setEtape('generation')
    try {
      // Construire les données complètes
      const donnees: Record<string, unknown> = {
        nom_entreprise: profile.entreprise ?? '',
        secteur: diagnostic?.reponses?.secteur ?? '',
        statut_juridique: diagnostic?.reponses?.statut_juridique ?? '',
        effectif: diagnostic?.reponses?.effectif ?? '',
        annee_creation: diagnostic?.reponses?.annee_creation ?? '',
        region: diagnostic?.reponses?.region ?? '',
        embauche_prevue_ma: diagnostic?.reponses?.embauche_prevue_ma ?? '',
        montant_projet: diagnostic?.reponses?.montant_projet ?? '',
        ...questionsRep,
      }
      // Ajouter le contexte par document
      for (const doc of docsAPrep) {
        donnees[`__mode_${doc.id}`] = docModes[doc.id] ?? 'generer'
        if (docContexte[doc.id]) {
          for (const [k, v] of Object.entries(docContexte[doc.id])) {
            donnees[`__ctx_${doc.id}_${k}`] = v
          }
        }
      }

      const initRes = await fetch('/api/dossier/init', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispositifId: dispositif.id, diagnosticId, donnees }),
      })
      if (!initRes.ok) {
        const err = await initRes.json() as { error: string }
        setErreur(err.error === 'no_credits' ? 'Solde insuffisant.' : 'Erreur d\'initialisation.')
        setEtape('recap'); return
      }
      const { dossierId } = await initRes.json() as { dossierId: string }
      setSolde((s) => s - 1)

      const genRes = await fetch('/api/dossier/generer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dossierId }),
      })
      if (genRes.status === 422) {
        const err = await genRes.json() as { error: string; alerte: string }
        setAlerte(err.alerte); setEtape('recap'); return
      }
      if (!genRes.ok) throw new Error()
      const genData = await genRes.json() as { ok: boolean; generated: Record<string, string> }
      setGeneratedDocs(genData.generated ?? {})
      setEtape('done')
    } catch {
      setErreur('Erreur de génération. Réessayez.')
      setEtape('recap')
    } finally { setLoading(false) }
  }

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const buffer = new ArrayBuffer(binary.length)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return buffer
  }

  function downloadDoc(docId: string, label: string) {
    const base64 = generatedDocs[docId]
    if (!base64) return
    const blob = new Blob([base64ToArrayBuffer(base64)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${label.replace(/[\s/]+/g, '_')}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  function downloadUploadedDoc(docId: string, label: string) {
    const file = docFiles[docId]
    if (!file) return
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url; a.download = file.name; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAllZip = useCallback(async () => {
    const zip = new JSZip()
    for (const doc of docsAPrep) {
      const m = docModes[doc.id]
      const safeName = doc.label.replace(/[\s/\\:*?"<>|]+/g, '_')
      if (m === 'generer' && generatedDocs[doc.id]) {
        zip.file(`${safeName}.pdf`, base64ToArrayBuffer(generatedDocs[doc.id]))
      } else if (m === 'upload' && docFiles[doc.id]) {
        zip.file(docFiles[doc.id].name, docFiles[doc.id])
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dossier_${dispositif.nom.replace(/[\s/\\:*?"<>|]+/g, '_')}.zip`; a.click()
    URL.revokeObjectURL(url)
  }, [docsAPrep, docModes, generatedDocs, docFiles, dispositif.nom])

  function prefillQuestion(q: QuestionSpecifique): string {
    if (!q.source_prefill) return ''
    const parts = q.source_prefill.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = { profile, diagnostic }
    for (const p of parts) { if (cur == null) return ''; cur = cur[p] }
    return cur != null ? String(cur) : ''
  }

  const montant = dispositif.montant_max
    ? `${(dispositif.montant_max / 1000).toFixed(0)} K ${dispositif.devise}`
    : dispositif.taux ? `${dispositif.taux}% du projet` : '—'

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="px-8 py-8 w-full max-w-2xl">
      <BackLink diagnosticId={diagnosticId} />

      {/* ── INTRO ── */}
      {etape === 'intro' && (
        <div>
          <div className="mb-6">
            <div className="text-[12px] font-medium text-ardoise-clair uppercase tracking-wide mb-1.5">{dispositif.organisme}</div>
            <h1 className="font-grotesk font-bold text-[24px] text-ardoise mb-3">{dispositif.nom}</h1>
            <div className="flex gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[12px] font-medium" style={{ backgroundColor: 'var(--vert-pale)', color: 'var(--vert)' }}>{montant}</span>
              {dispositif.delai_indicatif && (
                <span className="px-3 py-1 rounded-full text-[12px] font-medium" style={{ backgroundColor: 'var(--pierre-clair)', color: 'var(--ardoise-moyen)' }}>{dispositif.delai_indicatif}</span>
              )}
            </div>
          </div>

          {/* Formulaire officiel à télécharger */}
          {schema.lien_formulaire_officiel && (
            <div className="card p-5 mb-4" style={{ borderColor: 'var(--corail)', backgroundColor: '#FFF9F6' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--corail)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4m0 12l-4-4m4 4l4-4M4 20h16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[13px] text-ardoise mb-0.5">Formulaire officiel requis</div>
                  <div className="text-[12px] text-ardoise-clair mb-2">Ce dispositif nécessite de compléter un formulaire officiel que vous devrez déposer.</div>
                  <a href={schema.lien_formulaire_officiel} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--corail)' }}>
                    Télécharger le formulaire ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] text-ardoise-moyen">Votre solde</span>
              <span className="font-grotesk font-bold text-[18px]" style={{ color: solde > 0 ? 'var(--vert)' : 'var(--corail)' }}>
                {solde} dossier{solde !== 1 ? 's' : ''}
              </span>
            </div>
            <button onClick={() => solde < 1 ? setEtape('paiement') : setEtape('coffre_fort')} className="btn-primary w-full py-3">
              {solde < 1 ? 'Recharger et démarrer →' : 'Démarrer →'}
            </button>
          </div>
        </div>
      )}

      {/* ── PAIEMENT ── */}
      {etape === 'paiement' && (
        <div>
          <h2 className="font-grotesk font-bold text-[20px] text-ardoise mb-1">Recharger votre compte</h2>
          <p className="text-[13px] text-ardoise-clair mb-6">1 crédit = 1 dossier complet généré par IA</p>
          {erreur && <AlerteErreur message={erreur} />}
          <div className="space-y-3 mb-6">
            {packs.map((pack) => (
              <button key={pack.id} onClick={() => handleAchat(pack.id)} disabled={loading}
                className="w-full card text-left p-5 hover:border-corail transition-colors disabled:opacity-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-grotesk font-bold text-[16px] text-ardoise">{pack.label}</div>
                    <div className="text-[13px] text-ardoise-clair mt-0.5">{pack.nb_dossiers} dossier{pack.nb_dossiers > 1 ? 's' : ''}</div>
                    {pack.badge && (
                      <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: 'var(--corail)', color: '#fff' }}>{pack.badge}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-grotesk font-bold text-[18px] text-ardoise">{pack.prix_total} MAD</div>
                    <div className="text-[12px] text-ardoise-clair">{pack.prix_unitaire} MAD/dossier</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setEtape('intro')} className="text-[13px] text-ardoise-clair hover:text-ardoise transition">← Retour</button>
          <p className="text-[11px] text-ardoise-clair mt-4">Mode démo — aucun paiement réel.</p>
        </div>
      )}

      {/* ── COFFRE-FORT ── */}
      {etape === 'coffre_fort' && (
        <div>
          <StepHeader titre="Documents entreprise" sousTitre="Vérifiez vos pièces justificatives. Importez les documents manquants directement ici." />
          {erreur && <AlerteErreur message={erreur} onClose={() => setErreur(null)} />}

          {cfRequis.length === 0 ? (
            <div className="card p-5 text-center text-ardoise-clair text-[14px] mb-6">Aucun document entreprise requis pour ce dispositif.</div>
          ) : (
            <div className="space-y-4 mb-6">
              {cfRequis.map((c) => {
                const doc = docsExistants[c.type_document]
                const isUploading = cfUploading === c.type_document
                return (
                  <div key={c.type_document} className="card p-5" style={{ borderColor: doc ? 'var(--vert)' : undefined }}>
                    <div className="flex items-start gap-3">
                      {/* Icône statut */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: doc ? 'var(--vert-pale)' : 'var(--pierre-clair)' }}>
                        {doc
                          ? <span style={{ color: 'var(--vert)', fontSize: 16 }}>✓</span>
                          : <span style={{ color: 'var(--ardoise-clair)', fontSize: 16 }}>○</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[14px] text-ardoise">{c.label}</span>
                          {c.obligatoire && <span className="text-[11px]" style={{ color: 'var(--corail)' }}>Obligatoire</span>}
                          {doc && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--vert-pale)', color: 'var(--vert)' }}>
                              {doc.source === 'upload' && doc.fichier_nom ? doc.fichier_nom : 'Présent'}
                            </span>
                          )}
                        </div>
                        {c.description && <div className="text-[12px] text-ardoise-clair mt-0.5">{c.description}</div>}

                        {/* Zone upload si absent */}
                        {!doc && (
                          <div className="mt-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <div className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-medium transition"
                                style={{ border: '1px dashed var(--pierre)', backgroundColor: isUploading ? 'var(--pierre-clair)' : 'transparent' }}>
                                {isUploading
                                  ? <><span className="animate-spin inline-block w-4 h-4 border-2 rounded-full" style={{ borderColor: 'var(--pierre)', borderTopColor: 'var(--vert)' }} />Chargement…</>
                                  : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Importer (PDF / JPEG, max 5 Mo)</>
                                }
                              </div>
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={isUploading}
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCoffreFort(c.type_document, f) }} />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <NavButtons
            onBack={() => setEtape('intro')}
            onNext={() => setEtape(nextAfterCoffre())}
            canNext={cfComplet}
            nextLabel={nextAfterCoffre() === 'recap' ? 'Récapitulatif →' : 'Continuer →'}
            blockedReason={!cfComplet ? 'Importez les documents obligatoires pour continuer' : undefined}
          />
        </div>
      )}

      {/* ── QUESTIONS ── */}
      {etape === 'questions' && (
        <div>
          <StepHeader titre="Informations complémentaires" sousTitre="Ces informations sont nécessaires pour vérifier votre éligibilité et préparer vos documents." />
          <div className="space-y-5 mb-6">
            {questionsRequises.map((q) => {
              const val = questionsRep[q.id] !== undefined ? String(questionsRep[q.id]) : prefillQuestion(q)
              const err = validationErrors[q.id]
              return (
                <div key={q.id}>
                  <label className="block text-[13px] font-medium text-ardoise mb-1.5">
                    {q.label}{q.obligatoire && <span style={{ color: 'var(--corail)' }}> *</span>}
                    {q.unite && <span className="font-normal text-ardoise-clair"> ({q.unite})</span>}
                  </label>
                  {q.type === 'textarea' ? (
                    <textarea className={`input min-h-[90px] resize-y ${err ? 'border-red-400' : ''}`} placeholder={q.placeholder ?? ''}
                      value={val}
                      onChange={(e) => {
                        const newAnswers = { ...questionsRep, [q.id]: e.target.value }
                        setQuestionsRep(newAnswers)
                        setValidationErrors(computeValidationErrors(newAnswers))
                      }} />
                  ) : q.type === 'select' && q.options ? (
                    <select className={`input ${err ? 'border-red-400' : ''}`} value={val}
                      onChange={(e) => {
                        const newAnswers = { ...questionsRep, [q.id]: e.target.value }
                        setQuestionsRep(newAnswers)
                        setValidationErrors(computeValidationErrors(newAnswers))
                      }}>
                      <option value="">— Sélectionner —</option>
                      {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={q.type === 'number' ? 'number' : 'text'}
                      className={`input ${err ? 'border-red-400' : ''}`}
                      placeholder={q.placeholder ?? ''} value={val}
                      onChange={(e) => {
                        const newVal = q.type === 'number' ? Number(e.target.value) : e.target.value
                        const newAnswers = { ...questionsRep, [q.id]: newVal }
                        setQuestionsRep(newAnswers)
                        setValidationErrors(computeValidationErrors(newAnswers))
                      }} />
                  )}
                  {err && (
                    <div className="mt-2 p-3 rounded-[8px] text-[12px]" style={{ backgroundColor: '#FFF6EF', color: '#7A4A2E' }}>
                      ⚠ {err}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <NavButtons
            onBack={() => setEtape('coffre_fort')}
            onNext={() => setEtape(nextAfterQuestions())}
            canNext={questionsCompletes && !hasValidationErrors}
            nextLabel={nextAfterQuestions() === 'recap' ? 'Récapitulatif →' : 'Continuer →'}
            blockedReason={hasValidationErrors ? 'Corrigez les erreurs ci-dessus pour continuer' : undefined}
          />
        </div>
      )}

      {/* ── DOCS À PRÉPARER ── */}
      {etape === 'docs_prep' && (
        <div>
          <StepHeader titre="Documents à préparer" sousTitre="Pour chaque document, choisissez de le téléverser si vous l'avez déjà, ou laissez l'IA vous aider à le rédiger." />
          <div className="space-y-6 mb-6">
            {docsAPrep.map((doc) => {
              const mode = docModes[doc.id]
              const isUploading = docUploading[doc.id]
              const file = docFiles[doc.id]
              return (
                <div key={doc.id} className="card p-5">
                  {/* En-tête document */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                      style={{ backgroundColor: 'var(--pierre-clair)', color: 'var(--ardoise-moyen)' }}>W</div>
                    <div>
                      <div className="font-semibold text-[14px] text-ardoise">{doc.label}</div>
                      {doc.description && <div className="text-[12px] text-ardoise-clair mt-0.5">{doc.description}</div>}
                    </div>
                  </div>

                  {/* Sélection du mode si 'choix' */}
                  {doc.mode === 'choix' && (
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setDocModes((p) => ({ ...p, [doc.id]: 'upload' }))}
                        className="flex-1 py-2.5 rounded-[10px] text-[13px] font-medium border transition"
                        style={{
                          borderColor: mode === 'upload' ? 'var(--vert)' : 'var(--pierre)',
                          backgroundColor: mode === 'upload' ? 'var(--vert-pale)' : 'transparent',
                          color: mode === 'upload' ? 'var(--vert)' : 'var(--ardoise-moyen)',
                        }}>
                        ↑ Téléverser
                      </button>
                      <button
                        onClick={() => setDocModes((p) => ({ ...p, [doc.id]: 'generer' }))}
                        className="flex-1 py-2.5 rounded-[10px] text-[13px] font-medium border transition"
                        style={{
                          borderColor: mode === 'generer' ? 'var(--corail)' : 'var(--pierre)',
                          backgroundColor: mode === 'generer' ? '#FFF9F6' : 'transparent',
                          color: mode === 'generer' ? 'var(--corail)' : 'var(--ardoise-moyen)',
                        }}>
                        ✦ Générer via IA
                      </button>
                    </div>
                  )}

                  {/* Zone upload */}
                  {mode === 'upload' && (
                    <div>
                      {file ? (
                        <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ backgroundColor: 'var(--vert-pale)' }}>
                          <span style={{ color: 'var(--vert)' }}>✓</span>
                          <span className="text-[13px] text-ardoise flex-1 truncate">{file.name}</span>
                          <button onClick={() => setDocFiles((p) => { const n = { ...p }; delete n[doc.id]; return n })}
                            className="text-[12px] text-ardoise-clair hover:text-ardoise">Changer</button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-[10px] cursor-pointer transition"
                          style={{ border: '2px dashed var(--pierre)', backgroundColor: isUploading ? 'var(--pierre-clair)' : 'transparent' }}>
                          {isUploading
                            ? <span className="text-[13px] text-ardoise-clair">Chargement…</span>
                            : <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke="#8A8378" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span className="text-[13px] text-ardoise-clair">Cliquez ou glissez votre fichier</span>
                              <span className="text-[11px] text-ardoise-clair">PDF / JPEG / PNG — max 5 Mo</span>
                            </>
                          }
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" className="sr-only" disabled={isUploading}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocPrep(doc, f) }} />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Questions contexte pour génération IA */}
                  {mode === 'generer' && doc.questions_contexte && doc.questions_contexte.length > 0 && (
                    <div>
                      <div className="text-[12px] font-semibold uppercase tracking-wide text-ardoise-clair mb-3">
                        Informations pour l&apos;IA
                        <span className="normal-case font-normal ml-1">(plus vous détaillez, meilleur sera le document)</span>
                      </div>
                      <div className="space-y-4">
                        {doc.questions_contexte.map((q) => {
                          const val = docContexte[doc.id]?.[q.id] ?? ''
                          return (
                            <div key={q.id}>
                              <label className="block text-[13px] font-medium text-ardoise mb-1">
                                {q.label}{q.obligatoire && <span style={{ color: 'var(--corail)' }}> *</span>}
                              </label>
                              {q.type === 'textarea' ? (
                                <textarea className="input min-h-[80px] resize-y" placeholder={q.placeholder ?? ''}
                                  value={val}
                                  onChange={(e) => setDocContexte((prev) => ({
                                    ...prev,
                                    [doc.id]: { ...(prev[doc.id] ?? {}), [q.id]: e.target.value }
                                  }))} />
                              ) : q.type === 'select' && q.options ? (
                                <select className="input" value={val}
                                  onChange={(e) => setDocContexte((prev) => ({
                                    ...prev,
                                    [doc.id]: { ...(prev[doc.id] ?? {}), [q.id]: e.target.value }
                                  }))}>
                                  <option value="">— Sélectionner —</option>
                                  {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              ) : (
                                <input type={q.type === 'number' ? 'number' : 'text'} className="input"
                                  placeholder={q.placeholder ?? ''} value={val}
                                  onChange={(e) => setDocContexte((prev) => ({
                                    ...prev,
                                    [doc.id]: { ...(prev[doc.id] ?? {}), [q.id]: e.target.value }
                                  }))} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode forcé non interactif */}
                  {doc.mode !== 'choix' && !mode && (
                    <div className="text-[13px] text-ardoise-clair">Sélectionnez une option ci-dessus.</div>
                  )}
                </div>
              )
            })}
          </div>
          <NavButtons
            onBack={() => setEtape(hasQuestions ? 'questions' : 'coffre_fort')}
            onNext={() => setEtape('recap')}
            canNext={docsPreparesComplets}
            nextLabel="Récapitulatif →"
          />
        </div>
      )}

      {/* ── RECAP ── */}
      {etape === 'recap' && (
        <div>
          <StepHeader titre="Récapitulatif" sousTitre="Vérifiez avant de confirmer. 1 crédit sera consommé pour les documents générés par IA." />

          {alerte && (
            <div className="mb-5 p-4 rounded-[12px] border" style={{ backgroundColor: '#FFF6EF', borderColor: '#F3D8C2' }}>
              <div className="font-semibold text-[13px] mb-1" style={{ color: '#7A4A2E' }}>⚠ Génération bloquée</div>
              <div className="text-[13px]" style={{ color: '#7A4A2E' }}>{alerte}</div>
              <button onClick={() => { setAlerte(null); setEtape('questions') }}
                className="mt-3 text-[12px] font-medium underline" style={{ color: '#7A4A2E' }}>
                Corriger mes réponses
              </button>
            </div>
          )}
          {erreur && <AlerteErreur message={erreur} onClose={() => setErreur(null)} />}

          {/* Documents entreprise */}
          {cfRequis.length > 0 && (
            <div className="card p-5 mb-4">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-ardoise-clair mb-3">Documents vérifiés</div>
              {cfRequis.map((c) => (
                <div key={c.type_document} className="flex items-center gap-2 text-[13px] py-1">
                  <span style={{ color: docsExistants[c.type_document] ? 'var(--vert)' : 'var(--ardoise-clair)' }}>
                    {docsExistants[c.type_document] ? '✓' : '○'}
                  </span>
                  <span className="text-ardoise-moyen">{c.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Réponses aux questions */}
          {questionsRequises.length > 0 && (
            <div className="card p-5 mb-4">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-ardoise-clair mb-3">Vos réponses</div>
              {questionsRequises.map((q) => (
                <div key={q.id} className="grid grid-cols-2 gap-2 text-[13px] py-1">
                  <span className="text-ardoise-clair">{q.label}</span>
                  <span className="font-medium text-ardoise text-right">
                    {questionsRep[q.id] != null && questionsRep[q.id] !== '' ? String(questionsRep[q.id]) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Documents à préparer */}
          {docsAPrep.length > 0 && (
            <div className="card p-5 mb-4">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-ardoise-clair mb-3">Documents à générer</div>
              {docsAPrep.map((doc) => {
                const m = docModes[doc.id]
                return (
                  <div key={doc.id} className="flex items-center gap-2 text-[13px] py-1.5">
                    <span style={{ color: m === 'generer' ? 'var(--corail)' : 'var(--vert)' }}>
                      {m === 'generer' ? '✦' : '✓'}
                    </span>
                    <span className="flex-1 text-ardoise-moyen">{doc.label}</span>
                    <span className="text-[11px]" style={{ color: m === 'generer' ? 'var(--corail)' : 'var(--ardoise-clair)' }}>
                      {m === 'generer' ? 'via IA' : docFiles[doc.id]?.name ?? 'téléversé'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Solde */}
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ardoise-moyen">Solde après génération</span>
              <span className="font-grotesk font-bold text-[16px]" style={{ color: solde > 1 ? 'var(--ardoise)' : 'var(--corail)' }}>
                {Math.max(0, solde - 1)} crédit{solde - 1 !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setEtape(prevBeforeRecap())} className="text-[13px] text-ardoise-clair hover:text-ardoise transition">← Retour</button>
            <button onClick={handleGenerer} disabled={loading || solde < 1} className="btn-primary px-8 py-3 disabled:opacity-40">
              {docsAPrep.some((d) => docModes[d.id] === 'generer') ? 'Générer les documents →' : 'Finaliser le dossier →'}
            </button>
          </div>
        </div>
      )}

      {/* ── GÉNÉRATION ── */}
      {etape === 'generation' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-full border-2 animate-spin mb-6"
            style={{ borderColor: 'var(--pierre)', borderTopColor: 'var(--vert)' }} />
          <h2 className="font-grotesk font-bold text-[20px] text-ardoise mb-2">Génération en cours…</h2>
          <p className="text-[14px] text-ardoise-clair text-center max-w-sm">
            L&apos;IA rédige vos documents. Environ 20 à 40 secondes.
          </p>
        </div>
      )}

      {/* ── DONE ── */}
      {etape === 'done' && (
        <div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--vert-pale)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="#1F5A44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="#1F5A44" strokeWidth="1.8"/>
            </svg>
          </div>
          <h2 className="font-grotesk font-bold text-[22px] text-ardoise mb-1">Vos documents sont prêts !</h2>
          <p className="text-[13px] text-ardoise-clair mb-6">{docsAPrep.length} document{docsAPrep.length > 1 ? 's' : ''} pour {dispositif.nom}.</p>

          <div className="space-y-3 mb-5">
            {docsAPrep.map((doc) => {
              const m = docModes[doc.id]
              const hasGenerated = !!generatedDocs[doc.id]
              const hasFile = !!docFiles[doc.id]
              return (
                <div key={doc.id} className="card flex items-center gap-4 p-4">
                  <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: m === 'generer' ? '#FFF9F6' : 'var(--vert-pale)', color: m === 'generer' ? 'var(--corail)' : 'var(--vert)' }}>
                    {m === 'generer' ? 'PDF' : '✓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-ardoise">{doc.label}</div>
                    <div className="text-[12px] text-ardoise-clair">
                      {m === 'generer' && hasGenerated ? 'Généré par IA — PDF' : hasFile ? docFiles[doc.id]?.name : 'Document prêt'}
                    </div>
                  </div>
                  {m === 'generer' && hasGenerated && (
                    <button onClick={() => downloadDoc(doc.id, doc.label)} className="btn-primary px-4 py-2 text-[12px]">
                      ↓ PDF
                    </button>
                  )}
                  {m === 'upload' && hasFile && (
                    <button onClick={() => downloadUploadedDoc(doc.id, doc.label)} className="px-4 py-2 text-[12px] rounded-[8px] font-medium border"
                      style={{ borderColor: 'var(--pierre)', color: 'var(--ardoise-moyen)' }}>
                      ↓ Voir
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Télécharger tout en ZIP */}
          {docsAPrep.length > 1 && (
            <button onClick={downloadAllZip}
              className="w-full py-3 rounded-[12px] text-[13px] font-semibold mb-5 flex items-center justify-center gap-2 transition"
              style={{ backgroundColor: 'var(--ardoise)', color: '#FAF8F5' }}>
              ↓ Télécharger tout le dossier (.zip)
            </button>
          )}

          {schema.lien_formulaire_officiel && (
            <div className="card p-4 mb-4" style={{ backgroundColor: '#FFF9F6', borderColor: 'var(--corail)' }}>
              <div className="text-[13px] text-ardoise-moyen mb-1">N&apos;oubliez pas le formulaire officiel</div>
              <a href={schema.lien_formulaire_officiel} target="_blank" rel="noopener noreferrer"
                className="font-semibold text-[13px]" style={{ color: 'var(--corail)' }}>
                Télécharger le formulaire officiel ↗
              </a>
            </div>
          )}

          <Link href="/tableau-de-bord" className="block text-center w-full py-3 rounded-[10px] text-[14px] font-medium text-ardoise-moyen transition"
            style={{ border: '0.5px solid var(--pierre)' }}>
            ← Retour au tableau de bord
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Sous-composants ─────────────────────────────────────────────────────────────

function BackLink({ diagnosticId }: { diagnosticId: string | null }) {
  return (
    <Link href={diagnosticId ? `/resultats/${diagnosticId}` : '/tableau-de-bord'}
      className="inline-flex items-center gap-1.5 text-[13px] text-ardoise-clair hover:text-ardoise transition mb-6">
      ← Retour
    </Link>
  )
}

function StepHeader({ titre, sousTitre }: { titre: string; sousTitre?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-grotesk font-bold text-[20px] text-ardoise mb-1">{titre}</h2>
      {sousTitre && <p className="text-[13px] text-ardoise-clair">{sousTitre}</p>}
    </div>
  )
}

function AlerteErreur({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="mb-4 px-4 py-3 rounded-[10px] flex items-start gap-2 text-[13px]" style={{ backgroundColor: '#FFF6EF', color: '#7A4A2E' }}>
      <span className="flex-1">{message}</span>
      {onClose && <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100">✕</button>}
    </div>
  )
}

function NavButtons({ onBack, onNext, canNext, nextLabel = 'Continuer →', blockedReason }: {
  onBack: () => void; onNext: () => void; canNext: boolean; nextLabel?: string; blockedReason?: string
}) {
  return (
    <div className="pt-4" style={{ borderTop: '1px solid var(--pierre)' }}>
      {blockedReason && !canNext && (
        <div className="mb-3 text-[12px] text-center" style={{ color: 'var(--ardoise-clair)' }}>{blockedReason}</div>
      )}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[13px] text-ardoise-clair hover:text-ardoise transition">← Retour</button>
        <button onClick={onNext} disabled={!canNext} className="btn-primary px-6 py-2.5 disabled:opacity-40">{nextLabel}</button>
      </div>
    </div>
  )
}
