'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Reponses } from '@/types'

const STORAGE_KEY = 'subventions_diagnostic_draft'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function InscriptionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromDiagnostic = searchParams.get('from') === 'diagnostic'

  const [form, setForm] = useState({ prenom: '', nom: '', email: '', motdepasse: '', entreprise: '', ville: '' })
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState('')
  const [confirmationEnvoyee, setConfirmationEnvoyee] = useState(false)

  async function handleGoogleSignIn() {
    setLoadingGoogle(true)
    setError('')
    if (fromDiagnostic && localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem('diagnostic_recovery_pending', '1')
    }
    const supabase = createClient()
    const raw = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const siteUrl = raw.startsWith('http') ? raw : `https://${raw}`
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/api/auth/callback?next=/tableau-de-bord`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (oauthError) {
      setError(`Google : ${oauthError.message}`)
      setLoadingGoogle(false)
      return
    }
    if (data?.url) {
      window.location.href = data.url
    }
  }

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
      if (fromDiagnostic && localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem('diagnostic_recovery_pending', '1')
      }
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
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loadingGoogle || loading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-ardoise transition disabled:opacity-40"
        >
          <GoogleIcon />
          {loadingGoogle ? 'Redirection...' : 'Continuer avec Google'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">ou créer un compte avec un email</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

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
          <button type="submit" disabled={loading || loadingGoogle} className="w-full py-3 rounded-xl bg-corail hover:bg-corail-fonce text-white text-sm font-medium transition disabled:opacity-40">
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
