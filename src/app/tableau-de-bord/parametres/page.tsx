'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LABELS } from '@/lib/labels'
import type { Profile } from '@/types'

type ProfileForm = Pick<Profile,
  'prenom' | 'nom' | 'telephone' | 'entreprise' | 'ville' |
  'secteur' | 'statut_juridique' | 'annee_creation' | 'ca_annuel' | 'effectif'
>

const EMPTY: ProfileForm = {
  prenom: null, nom: null, telephone: null, entreprise: null, ville: null,
  secteur: null, statut_juridique: null, annee_creation: null, ca_annuel: null, effectif: null,
}

type Tab = 'profil' | 'entreprise'

export default function ParametresPage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY)
  const [email, setEmail] = useState('')
  const [tab, setTab] = useState<Tab>('profil')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setEmail(data.user.email ?? '')
      supabase.from('profiles').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => {
          if (p) setForm({
            prenom: p.prenom, nom: p.nom, telephone: p.telephone,
            entreprise: p.entreprise, ville: p.ville,
            secteur: p.secteur ?? null, statut_juridique: p.statut_juridique ?? null,
            annee_creation: p.annee_creation ?? null,
            ca_annuel: p.ca_annuel ?? null,
            effectif: p.effectif ?? null,
          })
          setLoaded(true)
        })
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update(form).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function set(key: keyof ProfileForm, val: string | number | null) {
    setForm((f) => ({ ...f, [key]: val === '' ? null : val }))
  }

  if (!loaded) {
    return (
      <div className="px-8 py-8 flex items-center justify-center h-40">
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--pierre)', borderTopColor: 'var(--corail)' }} />
      </div>
    )
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'profil', label: 'Informations personnelles' },
    { key: 'entreprise', label: 'Mon entreprise' },
  ]

  return (
    <div className="px-8 py-8 w-full max-w-2xl">
      <h1 className="font-grotesk font-bold text-[22px] text-ardoise mb-6">Paramètres</h1>

      {/* Onglets */}
      <div className="flex gap-1 mb-8 p-1 rounded-[12px]" style={{ backgroundColor: 'var(--pierre-clair)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 text-[13px] font-medium rounded-[9px] py-2 transition"
            style={tab === t.key
              ? { backgroundColor: '#fff', color: 'var(--ardoise)', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: 'var(--ardoise-clair)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profil personnel ── */}
      {tab === 'profil' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Prénom</label>
              <input className="input" value={form.prenom ?? ''} onChange={(e) => set('prenom', e.target.value)} placeholder="Prénom" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Nom</label>
              <input className="input" value={form.nom ?? ''} onChange={(e) => set('nom', e.target.value)} placeholder="Nom de famille" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Email</label>
            <input className="input opacity-60 cursor-not-allowed" value={email} readOnly />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Téléphone</label>
            <input className="input" value={form.telephone ?? ''} onChange={(e) => set('telephone', e.target.value)} placeholder="+212 6 00 00 00 00" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Nom de l&apos;entreprise</label>
            <input className="input" value={form.entreprise ?? ''} onChange={(e) => set('entreprise', e.target.value)} placeholder="Nom commercial ou raison sociale" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Ville</label>
            <input className="input" value={form.ville ?? ''} onChange={(e) => set('ville', e.target.value)} placeholder="Casablanca, Paris…" />
          </div>
        </div>
      )}

      {/* ── Entreprise ── */}
      {tab === 'entreprise' && (
        <div className="space-y-4">
          <p className="text-[12px] text-ardoise-clair mb-2">
            Ces informations seront pré-remplies automatiquement dans vos prochains diagnostics.
          </p>
          <div>
            <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Secteur d&apos;activité</label>
            <select className="input" value={form.secteur ?? ''} onChange={(e) => set('secteur', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {Object.entries(LABELS.secteur).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Forme juridique</label>
            <select className="input" value={form.statut_juridique ?? ''} onChange={(e) => set('statut_juridique', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {Object.entries(LABELS.statut_juridique).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Année de création</label>
            <input
              className="input" type="number" min={1900} max={new Date().getFullYear()}
              value={form.annee_creation ?? ''}
              onChange={(e) => set('annee_creation', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="2020"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Chiffre d&apos;affaires annuel (MAD)</label>
            <select className="input" value={form.ca_annuel ?? ''} onChange={(e) => set('ca_annuel', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {Object.entries(LABELS.ca_annuel).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ardoise-moyen mb-1.5">Effectif</label>
            <select className="input" value={form.effectif ?? ''} onChange={(e) => set('effectif', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {Object.entries(LABELS.effectif).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Bouton save */}
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-6 py-2.5 disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
        {saved && (
          <span className="text-[13px] font-medium" style={{ color: 'var(--vert)' }}>
            ✓ Sauvegardé
          </span>
        )}
      </div>
    </div>
  )
}
