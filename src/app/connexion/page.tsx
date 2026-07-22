'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Reponses } from '@/types'

const STORAGE_KEY = 'subventions_diagnostic_draft'

function ConnexionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromDiagnostic = searchParams.get('from') === 'diagnostic'
  const redirect = searchParams.get('redirect')

  const [form, setForm] = useState({ email: '', motdepasse: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.motdepasse })

    if (signInError) {
      setError(signInError.message.includes('Email not confirmed')
        ? 'Email non confirmé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.'
        : 'Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    const draft = localStorage.getItem(STORAGE_KEY)
    if (draft && data.user) {
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

    router.push(redirect ?? '/tableau-de-bord')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold text-ardoise">Connexion</h1>
        {fromDiagnostic && <p className="text-sm text-ardoise-clair mt-1">Connectez-vous pour accéder à vos résultats</p>}
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Email</label><input className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Mot de passe</label><input className="input" type="password" required autoComplete="current-password" value={form.motdepasse} onChange={(e) => setForm({ ...form, motdepasse: e.target.value })} /></div>
          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl p-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-corail hover:bg-corail-fonce text-white text-sm font-medium transition disabled:opacity-40">
            {loading ? 'Connexion...' : 'Se connecter →'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-5">
          Pas encore de compte ? <Link href="/inscription" className="text-corail font-medium hover:underline">Créer un compte gratuit</Link>
        </p>
      </div>
    </div>
  )
}

export default function ConnexionPage() {
  return <Suspense><ConnexionForm /></Suspense>
}
