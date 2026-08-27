'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'
import type { Session } from '@supabase/supabase-js'

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
        router.replace(isGoogle
          ? '/inscription?step=profile&from=google'
          : '/inscription?step=profile'
        )
      } else {
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
