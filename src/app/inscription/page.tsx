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

function getPasswordStrength(pwd: string) {
  const checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  }
  const score = Object.values(checks).filter(Boolean).length
  return { checks, score }
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const { checks, score } = getPasswordStrength(password)
  const colors = ['#E7E1D9', '#E85D3B', '#F5A623', '#4CAF50', '#1F5A44']
  const labels = ['', 'Faible', 'Moyen', 'Fort', 'Très fort']

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: score >= i ? colors[score] : '#E7E1D9',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { ok: checks.length, label: '8 caractères' },
            { ok: checks.uppercase, label: 'Majuscule' },
            { ok: checks.number, label: 'Chiffre' },
            { ok: checks.special, label: 'Symbole' },
          ].map(({ ok, label }) => (
            <span key={label} style={{ fontSize: 11, color: ok ? '#1F5A44' : '#9B948C', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>{ok ? '✓' : '·'}</span> {label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: colors[score] }}>{labels[score]}</span>
        )}
      </div>
    </div>
  )
}

function InscriptionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromDiagnostic = searchParams.get('from') === 'diagnostic'

  const [form, setForm] = useState({ prenom: '', nom: '', email: '', motdepasse: '', motdepasseConfirm: '', entreprise: '', ville: '' })
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState('')
  const [confirmationEnvoyee, setConfirmationEnvoyee] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordMismatch = form.motdepasseConfirm.length > 0 && form.motdepasse !== form.motdepasseConfirm
  const { score } = getPasswordStrength(form.motdepasse)

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
        redirectTo: `${siteUrl}/auth/callback?next=/tableau-de-bord`,
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
    if (form.motdepasse !== form.motdepasseConfirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (score < 2) {
      setError('Mot de passe trop faible. Ajoutez des majuscules, chiffres ou symboles.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.motdepasse,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0F6F3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>📧</div>
        <h2 className="text-xl font-semibold text-ardoise mb-2">Confirmez votre email</h2>
        <p className="text-sm text-ardoise-clair mb-2">
          Un lien de confirmation a été envoyé à
        </p>
        <p className="text-sm font-semibold text-ardoise mb-6">{form.email}</p>
        <div className="card text-left space-y-3 mb-6">
          <p className="text-xs text-ardoise-clair font-medium uppercase tracking-wide">Comment procéder</p>
          {[
            '1. Ouvrez votre boîte mail',
            '2. Cherchez un email de "Fondouk" ou "noreply@supabase.io"',
            '3. Cliquez sur "Confirmer mon email"',
            '4. Vous serez redirigé vers votre tableau de bord',
          ].map((step) => (
            <p key={step} className="text-sm text-ardoise">{step}</p>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Pas reçu ? Vérifiez vos spams ou{' '}
          <button
            onClick={() => setConfirmationEnvoyee(false)}
            className="text-corail font-medium hover:underline"
          >
            réessayez avec un autre email
          </button>
        </p>
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
          <div><label className="label">Email</label><input className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>

          <div>
            <label className="label">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={form.motdepasse}
                onChange={(e) => setForm({ ...form, motdepasse: e.target.value })}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B948C', fontSize: 13 }}
                tabIndex={-1}
              >
                {showPassword ? 'Cacher' : 'Voir'}
              </button>
            </div>
            <PasswordStrength password={form.motdepasse} />
          </div>

          <div>
            <label className="label">Confirmer le mot de passe</label>
            <input
              className="input"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={form.motdepasseConfirm}
              onChange={(e) => setForm({ ...form, motdepasseConfirm: e.target.value })}
              style={{ borderColor: passwordMismatch ? '#E85D3B' : undefined }}
            />
            {passwordMismatch && (
              <p style={{ fontSize: 12, color: '#E85D3B', marginTop: 4 }}>Les mots de passe ne correspondent pas</p>
            )}
            {!passwordMismatch && form.motdepasseConfirm.length > 0 && (
              <p style={{ fontSize: 12, color: '#1F5A44', marginTop: 4 }}>✓ Les mots de passe correspondent</p>
            )}
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl p-3">{error}</div>}
          <button
            type="submit"
            disabled={loading || loadingGoogle || passwordMismatch || score < 1}
            className="w-full py-3 rounded-xl bg-corail hover:bg-corail-fonce text-white text-sm font-medium transition disabled:opacity-40"
          >
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
