'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Reponses } from '@/types'
import { Logo } from '@/components/layout/LogoFondouk'

const STORAGE_KEY = 'subventions_diagnostic_draft'

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Password strength ─────────────────────────────────────────────────────────

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
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: score >= i ? colors[score] : '#E7E1D9', transition: 'background 0.3s' }} />
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
        {score > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: colors[score] }}>{labels[score]}</span>}
      </div>
    </div>
  )
}

// ── Role cards ────────────────────────────────────────────────────────────────

type RoleType = 'dirigeant' | 'conseil' | 'autre'

const ROLE_OPTIONS: { id: RoleType; label: string; desc: string }[] = [
  { id: 'dirigeant', label: 'Dirigeant', desc: 'Je gère ma propre entreprise' },
  { id: 'conseil', label: 'Conseil / Accompagnateur', desc: "J'accompagne des entreprises" },
  { id: 'autre', label: 'Autre', desc: 'Curieux, étudiant, autre rôle' },
]

const GOAL_OPTIONS = [
  { value: 'financement', label: 'Obtenir un financement ou une subvention' },
  { value: 'exploration', label: 'Explorer toutes mes options disponibles' },
  { value: 'clients', label: 'Trouver des aides pour mes clients' },
  { value: 'autre', label: 'Autre' },
]

// ── Input style ───────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: '100%',
  fontFamily: "'Inter', sans-serif",
  fontSize: 13.5,
  padding: '10px 12px',
  border: '1px solid #E7E1D9',
  borderRadius: 10,
  background: '#FAF8F5',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#221F1D',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: '#4A453F',
  marginBottom: 6,
}

// ── Main form ─────────────────────────────────────────────────────────────────

function InscriptionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromDiagnostic = searchParams.get('from') === 'diagnostic'
  const initStep = searchParams.get('step') === 'profile' ? 'profile' : 'auth'
  const fromGoogle = searchParams.get('from') === 'google'

  const [step, setStep] = useState<'auth' | 'profile' | 'email_sent'>(initStep)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '', passwordConfirm: '' })
  const [roleType, setRoleType] = useState<RoleType | null>(null)
  const [roleOther, setRoleOther] = useState('')
  const [goal, setGoal] = useState('')
  const [goalOther, setGoalOther] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState('')
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; initials: string } | null>(null)

  const passwordMismatch = form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm
  const { score } = getPasswordStrength(form.password)
  const profileValid = !!roleType && (roleType !== 'autre' || roleOther.trim().length > 0) && !!goal

  // If step=profile&from=google, fetch current user
  useEffect(() => {
    if (step === 'profile' && fromGoogle) {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const fullName = (user.user_metadata?.full_name ?? user.email ?? '') as string
          const parts = fullName.split(' ')
          const initials = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : fullName.slice(0, 2).toUpperCase()
          setGoogleUser({ name: fullName, email: user.email ?? '', initials })
        }
      })
    }
  }, [step, fromGoogle])

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
    if (oauthError) { setError(`Google : ${oauthError.message}`); setLoadingGoogle(false); return }
    if (data?.url) window.location.href = data.url
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (score < 2) { setError('Mot de passe trop faible. Ajoutez des majuscules, chiffres ou symboles.'); return }
    if (!roleType) { setError('Veuillez indiquer votre rôle.'); return }
    if (!goal) { setError('Veuillez sélectionner votre objectif principal.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // stocke role/goal dans user_metadata pour les récupérer après confirmation email
        data: {
          prenom: form.prenom, nom: form.nom,
          role_type: roleType,
          role_other_label: roleType === 'autre' ? roleOther.trim() : null,
          primary_goal: goal === 'autre' ? `autre: ${goalOther.trim()}` : goal,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message.includes('already') ? 'Un compte existe déjà avec cet email. Connectez-vous.' : signUpError.message)
      setLoading(false)
      return
    }
    if (!data.user) { setError('Erreur inattendue. Réessayez.'); setLoading(false); return }

    if (data.session) {
      // Session immédiate — upsert profil complet et redirection
      await supabase.from('profiles').upsert({
        id: data.user.id, prenom: form.prenom, nom: form.nom,
        role_type: roleType,
        role_other_label: roleType === 'autre' ? roleOther.trim() : null,
        primary_goal: goal === 'autre' ? `autre: ${goalOther.trim()}` : goal,
        onboarding_completed_at: new Date().toISOString(),
      })
      setLoading(false)

      if (fromDiagnostic) {
        const draft = localStorage.getItem(STORAGE_KEY)
        if (draft) {
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
      }
      router.push('/tableau-de-bord')
    } else {
      // Confirmation email requise
      setLoading(false)
      setStep('email_sent')
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profileValid) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expirée. Veuillez recommencer.'); setLoading(false); return }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      role_type: roleType,
      role_other_label: roleType === 'autre' ? roleOther.trim() : null,
      primary_goal: goal,
      onboarding_completed_at: new Date().toISOString(),
    })

    if (profileError) { setError('Erreur lors de l\'enregistrement. Réessayez.'); setLoading(false); return }

    // Handle diagnostic flow — fromDiagnostic OU diagnostic_recovery_pending (Google OAuth depuis le mur)
    const recoveryPending = !!localStorage.getItem('diagnostic_recovery_pending')
    if (fromDiagnostic || recoveryPending) {
      const draft = localStorage.getItem(STORAGE_KEY)
      if (draft) {
        try {
          const reponses = JSON.parse(draft) as Reponses
          const { data: diagnostic } = await supabase.from('diagnostics').insert({ user_id: user.id, pays: reponses.pays ?? 'MA', reponses }).select().single()
          if (diagnostic) {
            await fetch('/api/matching', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagnosticId: diagnostic.id }) })
            localStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem('diagnostic_recovery_pending')
            router.push(`/resultats/${diagnostic.id}`)
            return
          }
        } catch {}
      }
      localStorage.removeItem('diagnostic_recovery_pending')
    }
    router.push('/tableau-de-bord')
  }

  // ── Email confirmation sent ─────────────────────────────────────────────────
  if (step === 'email_sent') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0F6F3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>📧</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 10 }}>Confirmez votre email</div>
          <p style={{ fontSize: 14, color: '#6B6560', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: 440 }}>
            Un lien de confirmation a été envoyé à <strong style={{ color: '#221F1D' }}>{form.email}</strong>. Cliquez dessus pour activer votre compte.
          </p>
          <div style={{ background: '#FAF8F5', border: '1px solid #E7E1D9', borderRadius: 12, padding: '16px 20px', textAlign: 'left', marginBottom: 20 }}>
            {['1. Ouvrez votre boîte mail', '2. Cherchez l\'email de confirmation — il est envoyé par Supabase (noreply@supabase.io), notre partenaire d\'authentification', '3. Cliquez sur "Confirmer mon email"', '4. Vous serez redirigé vers votre tableau de bord'].map((s) => (
              <p key={s} style={{ fontSize: 13.5, color: '#4A453F', margin: '4px 0', lineHeight: 1.5 }}>{s}</p>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: '#8A8378' }}>
            Pas reçu ?{' '}
            <button onClick={() => setStep('auth')} style={{ color: '#E2703A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, textDecoration: 'underline', padding: 0 }}>
              Réessayer avec un autre email
            </button>
          </p>
        </div>
      </PageShell>
    )
  }

  // ── Profile step ────────────────────────────────────────────────────────────
  if (step === 'profile') {
    const prenom = fromGoogle ? (googleUser?.name?.split(' ')[0] ?? '') : form.prenom
    return (
      <PageShell>
        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
            {prenom ? `Bienvenue, ${prenom}` : 'Votre profil'}
          </div>
          <p style={{ fontSize: 14, color: '#6B6560', lineHeight: 1.6, margin: 0 }}>
            {fromGoogle
              ? 'Votre compte Google est connecté. Deux questions rapides pour personnaliser votre expérience.'
              : 'Encore deux questions rapides pour personnaliser votre expérience.'}
          </p>
        </div>

        {/* Google account card */}
        {fromGoogle && googleUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#FAF8F5', border: '1px solid #E7E1D9', borderRadius: 14, padding: '14px 18px', marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1F5A44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: '#FAF8F5', flexShrink: 0 }}>
              {googleUser.initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#221F1D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{googleUser.name}</div>
              <div style={{ fontSize: 12.5, color: '#6B6560', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{googleUser.email}</div>
            </div>
            <div style={{ flexShrink: 0, marginLeft: 'auto', background: '#EAF3EE', color: '#1F5A44', fontSize: 11, fontWeight: 700, borderRadius: 100, padding: '3px 9px', whiteSpace: 'nowrap' }}>
              Compte Google vérifié
            </div>
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          {/* Rôle */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ ...LABEL, fontSize: 14, marginBottom: 12 }}>Vous êtes…</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.id} type="button" onClick={() => setRoleType(r.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12,
                    background: roleType === r.id ? '#F7FAF8' : '#fff',
                    border: `1.5px solid ${roleType === r.id ? '#1F5A44' : '#E7E1D9'}`,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${roleType === r.id ? '#1F5A44' : '#C9BFAE'}`, background: roleType === r.id ? '#1F5A44' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {roleType === r.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: roleType === r.id ? '#1F5A44' : '#221F1D' }}>{r.label}</div>
                    <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 2 }}>{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {roleType === 'autre' && (
              <div style={{ marginTop: 12 }}>
                <input
                  type="text" placeholder="Précisez votre rôle…"
                  value={roleOther} onChange={(e) => setRoleOther(e.target.value)}
                  style={INPUT}
                />
              </div>
            )}
          </div>

          {/* Objectif */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ ...LABEL, fontSize: 14, marginBottom: 10 }}>Que cherchez-vous en priorité ?</label>
            <div style={{ position: 'relative' }}>
              <select
                value={goal} onChange={(e) => setGoal(e.target.value)}
                style={{ ...INPUT, appearance: 'none', paddingRight: 36, cursor: 'pointer', border: `1.5px solid ${goal ? '#1F5A44' : '#E7E1D9'}` }}
              >
                <option value="">Sélectionner une option…</option>
                {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8A8378', fontSize: 12 }}>▾</div>
            </div>
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: 13, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>{error}</div>}

          <button
            type="submit" disabled={!profileValid || loading}
            style={{
              width: '100%', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14.5,
              padding: '13px 0', borderRadius: 11, border: 'none',
              background: profileValid ? '#1F5A44' : '#E7E1D9',
              color: profileValid ? '#FAF8F5' : '#A8A199',
              cursor: profileValid ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Enregistrement…' : fromDiagnostic ? 'Terminer et voir mes résultats →' : 'Terminer et accéder au tableau de bord →'}
          </button>

          <p style={{ fontSize: 11.5, color: '#8A8378', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            Ces informations ne sont jamais partagées avec des tiers.
          </p>
        </form>
      </PageShell>
    )
  }

  // ── Auth step ───────────────────────────────────────────────────────────────
  return (
    <PageShell>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        {fromDiagnostic && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF6EF', border: '1px solid #F3D8C2', color: '#B8552A', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 100, marginBottom: 14 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E2703A', display: 'inline-block' }} />
            Encore une étape pour voir vos résultats
          </div>
        )}
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Créer mon compte</div>
        <p style={{ fontSize: 13.5, color: '#6B6560', margin: 0 }}>Aucune carte bancaire. Résultats immédiats.</p>
      </div>

      {/* Google */}
      <button
        type="button" onClick={handleGoogleSignIn} disabled={loadingGoogle || loading}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '13px 0', borderRadius: 11, border: '1.5px solid #E7E1D9', background: '#fff',
          fontSize: 14, fontWeight: 600, color: '#221F1D', cursor: 'pointer',
          opacity: loadingGoogle || loading ? 0.5 : 1,
        }}
      >
        <GoogleIcon />
        {loadingGoogle ? 'Redirection…' : 'Continuer avec Google'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E7E1D9' }} />
        <span style={{ fontSize: 12.5, color: '#8A8378', whiteSpace: 'nowrap' }}>— ou par email —</span>
        <div style={{ flex: 1, height: 1, background: '#E7E1D9' }} />
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={LABEL}>Prénom <span style={{ color: '#E2703A' }}>*</span></label>
            <input style={INPUT} required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </div>
          <div>
            <label style={LABEL}>Nom <span style={{ color: '#E2703A' }}>*</span></label>
            <input style={INPUT} required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </div>
        </div>

        <div>
          <label style={LABEL}>Email professionnel <span style={{ color: '#E2703A' }}>*</span></label>
          <input style={INPUT} type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={LABEL}>Mot de passe <span style={{ color: '#E2703A' }}>*</span></label>
            <input style={INPUT} type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <PasswordStrength password={form.password} />
          </div>
          <div>
            <label style={LABEL}>Confirmer <span style={{ color: '#E2703A' }}>*</span></label>
            <input
              style={{ ...INPUT, borderColor: passwordMismatch ? '#E85D3B' : form.passwordConfirm && !passwordMismatch ? '#1F5A44' : '#E7E1D9' }}
              type="password" required autoComplete="new-password"
              value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
            />
            {passwordMismatch && <p style={{ fontSize: 11.5, color: '#E85D3B', marginTop: 4 }}>Ne correspond pas</p>}
            {!passwordMismatch && form.passwordConfirm.length > 0 && <p style={{ fontSize: 11.5, color: '#1F5A44', marginTop: 4 }}>✓ Identiques</p>}
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: '#E7E1D9', margin: '4px 0' }} />

        {/* Rôle */}
        <div>
          <label style={{ ...LABEL, fontSize: 13.5, marginBottom: 10 }}>Vous êtes… <span style={{ color: '#E2703A' }}>*</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.id} type="button" onClick={() => setRoleType(r.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10,
                  background: roleType === r.id ? '#F7FAF8' : '#fff',
                  border: `1.5px solid ${roleType === r.id ? '#1F5A44' : '#E7E1D9'}`,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${roleType === r.id ? '#1F5A44' : '#C9BFAE'}`, background: roleType === r.id ? '#1F5A44' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {roleType === r.id && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: roleType === r.id ? '#1F5A44' : '#221F1D' }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: '#6B6560' }}>{r.desc}</div>
                </div>
              </button>
            ))}
          </div>
          {roleType === 'autre' && (
            <input type="text" placeholder="Précisez votre rôle…" value={roleOther} onChange={(e) => setRoleOther(e.target.value)} style={{ ...INPUT, marginTop: 8 }} />
          )}
        </div>

        {/* Objectif */}
        <div>
          <label style={{ ...LABEL, fontSize: 13.5 }}>Objectif principal <span style={{ color: '#E2703A' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <select value={goal} onChange={(e) => setGoal(e.target.value)}
              style={{ ...INPUT, appearance: 'none', paddingRight: 36, cursor: 'pointer', border: `1.5px solid ${goal ? '#1F5A44' : '#E7E1D9'}` }}>
              <option value="">Sélectionner…</option>
              {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8A8378', fontSize: 12 }}>▾</div>
          </div>
          {goal === 'autre' && (
            <input
              type="text" placeholder="Précisez votre objectif…"
              value={goalOther} onChange={(e) => setGoalOther(e.target.value)}
              style={{ ...INPUT, marginTop: 8 }}
            />
          )}
        </div>

        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: 13, borderRadius: 10, padding: '10px 14px' }}>{error}</div>}

        <button
          type="submit" disabled={loading || loadingGoogle || passwordMismatch || score < 1}
          style={{
            width: '100%', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14.5,
            padding: '13px 0', borderRadius: 11, border: 'none',
            background: '#1F5A44', color: '#FAF8F5', cursor: 'pointer',
            opacity: loading || loadingGoogle || passwordMismatch || score < 1 ? 0.5 : 1,
          }}
        >
          {loading ? 'Création…' : fromDiagnostic ? 'Créer mon compte et voir mes résultats →' : 'Créer mon compte →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#8A8378', marginTop: 20 }}>
        Déjà un compte ?{' '}
        <Link href="/connexion" style={{ color: '#1F5A44', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
      </p>
    </PageShell>
  )
}

// ── Page shell (custom mini-header + card) ─────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#FAF8F5', color: '#221F1D', minHeight: '100%', paddingBottom: 60 }}>
      {/* Mini-header */}
      <div style={{ borderBottom: '1px solid #E7E1D9', background: 'rgba(250,248,245,0.96)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Logo size="nav" variant="beta" />
          </Link>
        </div>
      </div>

      {/* Contenu centré */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '44px 24px 0' }}>
        <div style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 20, padding: '32px 36px', boxShadow: '0 4px 20px rgba(34,31,29,.06)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Export ─────────────────────────────────────────────────────────────────────

export default function InscriptionPage() {
  return <Suspense><InscriptionForm /></Suspense>
}
