'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Reponses } from '@/types'

const STORAGE_KEY = 'subventions_diagnostic_draft'

function InscriptionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromDiagnostic = searchParams.get('from') === 'diagnostic'

  const [form, setForm] = useState({ prenom: '', nom: '', email: '', motdepasse: '', entreprise: '', ville: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationEnvoyee, setConfirmationEnvoyee] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.motdepasse,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: { prenom: form.prenom, nom: form.nom, entreprise: form.entreprise, ville: form.ville },
      },
    })

    if (signUpError) {
      setError(signUpError.message.includes('already') ? 'Un compte existe déjà avec cet email. Connectez-vous.' : signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) { setError('Erreur inattendue. Réessayez.'); setLoading(false); return }

    if (data.session) {
      await supabase.from('profiles').upsert({ id: data.user.id, prenom: form.prenom, nom: form.nom, entreprise: form.entreprise, ville: form.ville })
      const draft = localStorage.getItem(STORAGE_KEY)
      if (draft && fromDiagnostic) {
        try {
          const reponses = JSON.parse(draft) as Reponses
          const { data: diagnostic } = await supabase.from('diagnostics').insert({ user_id: data.user.id, pays: reponses.pays ?? 'MA', reponses }).select().single()
          if (diagnostic) {
            await fetch('/api/matching', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagnosticId: diagnostic.id }) })
            localStorage.removeItem(STORAGE_KEY)
            router.push(`/resultats/${diagnostic.id}`)
            return
          }
        } catch {}
      }
      router.push('/tableau-de-bord')
    } else {
      setConfirmationEnvoyee(true)
      setLoading(false)
    }
  }

  if (confirmationEnvoyee) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-corail-pale flex items-center justify-center mx-auto mb-4 text-2xl">📧</div>
        <h2 className="text-xl font-semibold text-ardoise mb-2">Vérifiez votre boîte mail</h2>
        <p className="text-sm text-ardoise-clair mb-6">Un email de confirmation a été envoyé à <strong>{form.email}</strong>. Cliquez sur le lien pour activer votre compte.</p>
        <div className="card bg-amber-50 border-amber-100 text-xs text-amber-700 text-left">
          <strong>Pour désactiver la confirmation email</strong> (recommandé en dev) :<br />
          Supabase → Authentication → Providers → Email → désactiver "Confirm email"
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        {fromDiagnostic && (
          <div className="inline-flex items-center gap-2 bg-corail-pale text-corail-fonce text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-corail inline-block"></span>
            Encore une étape pour voir vos résultats
          </div>
        )}
        <h1 className="text-xl font-semibold text-ardoise">Créer mon compte gratuit</h1>
        <p className="text-sm text-ardoise-clair mt-1">Aucune carte bancaire. Résultats immédiats.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Prénom</label><input className="input" required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
            <div><label className="label">Nom</label><input className="input" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
          </div>
          <div><label className="label">Entreprise</label><input className="input" value={form.entreprise} onChange={(e) => setForm({ ...form, entreprise: e.target.value })} /></div>
          <div><label className="label">Ville</label><input className="input" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" required minLength={8} value={form.motdepasse} onChange={(e) => setForm({ ...form, motdepasse: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
          </div>
          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl p-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-corail hover:bg-corail-fonce text-white text-sm font-medium transition disabled:opacity-40">
            {loading ? 'Création...' : fromDiagnostic ? 'Créer mon compte et voir mes résultats →' : 'Créer mon compte →'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-5">
          Déjà un compte ? <Link href="/connexion" className="text-corail font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

export default function InscriptionPage() {
  return <Suspense><InscriptionForm /></Suspense>
}
