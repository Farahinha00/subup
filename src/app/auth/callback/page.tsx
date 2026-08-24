'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next') ?? '/tableau-de-bord'
    const supabase = createClient()

    // Implicit flow: tokens are in URL hash — Supabase detects them via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        router.replace(next)
      }
    })

    // Fallback: session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        router.replace(next)
      }
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
