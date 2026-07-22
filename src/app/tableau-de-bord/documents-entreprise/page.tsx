'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TypeDocumentEntreprise, DocumentEntreprise } from '@/types/dossier'

const TYPES: Array<{ type: TypeDocumentEntreprise; label: string; description: string }> = [
  { type: 'rc',               label: 'Registre de commerce',       description: 'Extrait du RC moins de 3 mois' },
  { type: 'ice',              label: 'ICE',                        description: 'Identifiant Commun de l\'Entreprise' },
  { type: 'statuts',          label: 'Statuts de la société',      description: 'Statuts constitutifs signés' },
  { type: 'attestation_cnsss',label: 'Attestation CNSS',           description: 'Attestation de régularité en cours' },
  { type: 'dernier_bilan',    label: 'Dernier bilan comptable',    description: 'Bilan certifié par un CEC' },
  { type: 'cin_dirigeant',    label: 'CIN du dirigeant',           description: 'Copie recto-verso' },
  { type: 'patente',          label: 'Patente / TP',               description: 'Taxe professionnelle à jour' },
]

export default function DocumentsEntreprisePage() {
  const [docs, setDocs] = useState<Partial<Record<TypeDocumentEntreprise, DocumentEntreprise>>>({})
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<TypeDocumentEntreprise | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('documents_entreprise')
        .select('*')
        .eq('user_id', data.user.id)
        .then(({ data: rows }) => {
          if (rows) {
            const map: Partial<Record<TypeDocumentEntreprise, DocumentEntreprise>> = {}
            rows.forEach((r) => { map[r.type_document as TypeDocumentEntreprise] = r as DocumentEntreprise })
            setDocs(map)
          }
          setLoading(false)
        })
    })
  }, [])

  async function handleMarquer(type: TypeDocumentEntreprise) {
    setAdding(type)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(null); return }

    const existing = docs[type]
    if (existing) {
      await supabase.from('documents_entreprise').delete().eq('id', existing.id)
      setDocs((prev) => { const next = { ...prev }; delete next[type]; return next })
    } else {
      const { data } = await supabase.from('documents_entreprise').upsert({
        user_id: user.id,
        type_document: type,
        source: 'saisie_manuelle',
        fichier_url: null,
        fichier_nom: null,
        donnees_extraites: null,
        donnees_manuelles: null,
        statut: 'valide',
      }, { onConflict: 'user_id,type_document' }).select().single()
      if (data) setDocs((prev) => ({ ...prev, [type]: data as DocumentEntreprise }))
    }
    setAdding(null)
  }

  async function handleUpload(type: TypeDocumentEntreprise, file: File) {
    setAdding(type)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(null); return }

    // Upload to Storage (bucket 'documents-entreprise' must exist)
    const path = `${user.id}/${type}/${file.name}`
    const { data: upload, error: uploadErr } = await supabase.storage
      .from('documents-entreprise')
      .upload(path, file, { upsert: true })

    const fichier_url = upload ? supabase.storage.from('documents-entreprise').getPublicUrl(path).data.publicUrl : null
    if (uploadErr) console.warn('Storage upload failed:', uploadErr.message)

    const { data } = await supabase.from('documents_entreprise').upsert({
      user_id: user.id,
      type_document: type,
      source: 'upload',
      fichier_url,
      fichier_nom: file.name,
      donnees_extraites: null,
      donnees_manuelles: null,
      statut: 'valide',
    }, { onConflict: 'user_id,type_document' }).select().single()

    if (data) setDocs((prev) => ({ ...prev, [type]: data as DocumentEntreprise }))
    setAdding(null)
  }

  const disponibles = Object.keys(docs).length

  if (loading) {
    return (
      <div className="px-8 py-8 flex items-center justify-center h-40">
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--pierre)', borderTopColor: 'var(--corail)' }} />
      </div>
    )
  }

  return (
    <div className="px-8 py-8 w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="font-grotesk font-bold text-[22px] text-ardoise">Coffre-fort documents</h1>
        <p className="text-[13px] text-ardoise-clair mt-1">
          Vos documents d&apos;entreprise réutilisables pour tous vos dossiers de subvention.
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-[12px]" style={{ backgroundColor: disponibles > 0 ? 'var(--vert-pale)' : 'var(--pierre-clair)' }}>
        <span className="text-[22px] font-grotesk font-bold" style={{ color: disponibles > 0 ? 'var(--vert)' : 'var(--ardoise-clair)' }}>
          {disponibles}/{TYPES.length}
        </span>
        <span className="text-[13px]" style={{ color: disponibles > 0 ? 'var(--vert)' : 'var(--ardoise-clair)' }}>
          document{disponibles > 1 ? 's' : ''} disponible{disponibles > 1 ? 's' : ''}
        </span>
      </div>

      {/* Document list */}
      <div className="space-y-3">
        {TYPES.map(({ type, label, description }) => {
          const doc = docs[type]
          const isAdding = adding === type

          return (
            <div key={type} className="card flex items-center gap-4 p-4">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 font-grotesk font-bold text-[13px]"
                style={{ backgroundColor: doc ? 'var(--vert-pale)' : 'var(--pierre-clair)', color: doc ? 'var(--vert)' : 'var(--ardoise-clair)' }}
              >
                {doc ? '✓' : type.substring(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[14px] text-ardoise">{label}</div>
                <div className="text-[12px] text-ardoise-clair mt-0.5">
                  {doc?.fichier_nom ?? description}
                </div>
              </div>

              {/* Status + actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {doc ? (
                  <>
                    <span className="text-[12px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--vert-pale)', color: 'var(--vert)' }}>
                      Disponible
                    </span>
                    <button
                      onClick={() => handleMarquer(type)}
                      disabled={isAdding}
                      className="text-[12px] text-ardoise-clair hover:text-corail transition px-2 py-1"
                    >
                      {isAdding ? '…' : 'Retirer'}
                    </button>
                  </>
                ) : (
                  <>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(type, f) }}
                      />
                      <span
                        className="text-[12px] font-medium px-3 py-1.5 rounded-[8px] border transition cursor-pointer"
                        style={{ borderColor: 'var(--pierre)', color: 'var(--ardoise-moyen)' }}
                      >
                        {isAdding ? 'Ajout…' : 'Téléverser'}
                      </span>
                    </label>
                    <button
                      onClick={() => handleMarquer(type)}
                      disabled={isAdding}
                      className="text-[12px] font-medium px-3 py-1.5 rounded-[8px] transition"
                      style={{ backgroundColor: 'var(--pierre-clair)', color: 'var(--ardoise-moyen)' }}
                    >
                      {isAdding ? '…' : 'Marquer présent'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-ardoise-clair mt-6">
        Ces documents seront automatiquement reconnus lors du montage de vos dossiers.
      </p>
    </div>
  )
}
