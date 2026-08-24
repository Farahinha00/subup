'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/tableau-de-bord'

    if (!code) {
      router.replace('/connexion?error=no_code')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace(`/connexion?error=${encodeURIComponent(error.message)}`)
      } else {
        router.replace(next)
      }
    })
  }, [searchParams, router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#6B6560', fontSize: 14 }}>Connexion en cours...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return <Suspense><CallbackHandler /></Suspense>
}
