'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Reponses } from '@/types'

const STORAGE_KEY = 'subventions_diagnostic_draft'

export default function DiagnosticRecovery() {
  const router = useRouter()

  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY)
    if (!draft) return

    async function recover() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      try {
        const reponses = JSON.parse(draft!) as Reponses
        const { data: diagnostic } = await supabase
          .from('diagnostics')
          .insert({ user_id: user.id, pays: reponses.pays ?? 'MA', reponses })
          .select()
          .single()

        if (diagnostic) {
          await fetch('/api/matching', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diagnosticId: diagnostic.id }),
          })
          localStorage.removeItem(STORAGE_KEY)
          router.push(`/resultats/${diagnostic.id}`)
        }
      } catch {
        // draft malformé ou erreur réseau — on le laisse en place
      }
    }

    recover()
  }, [router])

  return null
}
