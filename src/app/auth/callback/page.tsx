'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Reponses } from '@/types'

const STORAGE_KEY = 'subventions_diagnostic_draft'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next') ?? '/tableau-de-bord'
    const supabase = createClient()
    let handled = false

    async function handleSession(session: Session) {
      if (handled) return
      handled = true
      subscription.unsubscribe()

      // Check if user has completed onboarding (new column added in v4 migration)
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('id', session.user.id)
        .single()

      if (!profile?.onboarding_completed_at) {
        const isGoogle = session.user.app_metadata?.provider === 'google'
        if (isGoogle) {
          router.replace('/inscription?step=profile&from=google')
        } else {
          // Email signup — récupère role/goal depuis user_metadata et finalise le profil
          const meta = session.user.user_metadata ?? {}
          await supabase.from('profiles').upsert({
            id: session.user.id,
            prenom: meta.prenom ?? null,
            nom: meta.nom ?? null,
            role_type: meta.role_type ?? null,
            role_other_label: meta.role_other_label ?? null,
            primary_goal: meta.primary_goal ?? null,
            onboarding_completed_at: new Date().toISOString(),
          })
          router.replace(next)
        }
      } else {
        // Utilisateur déjà inscrit — vérifier si un diagnostic est en attente de récupération
        const recoveryPending = localStorage.getItem('diagnostic_recovery_pending')
        const draftStr = localStorage.getItem(STORAGE_KEY)
        if (recoveryPending && draftStr) {
          try {
            const reponses = JSON.parse(draftStr) as Reponses
            const { data: diagnostic } = await supabase
              .from('diagnostics')
              .insert({ user_id: session.user.id, pays: reponses.pays ?? 'MA', reponses })
              .select().single()
            if (diagnostic) {
              await fetch('/api/matching', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagnosticId: diagnostic.id }) })
              localStorage.removeItem(STORAGE_KEY)
              localStorage.removeItem('diagnostic_recovery_pending')
              router.replace(`/resultats/${diagnostic.id}`)
              return
            }
          } catch {}
          localStorage.removeItem('diagnostic_recovery_pending')
        }
        router.replace(next)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleSession(session)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session)
    })

    return () => subscription.unsubscribe()
  }, [router, searchParams])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#6B6560', fontSize: 14 }}>Connexion en cours...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return <Suspense><CallbackHandler /></Suspense>
}
