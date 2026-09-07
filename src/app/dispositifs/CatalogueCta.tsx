'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function CtaBanner({ connected }: { connected: boolean }) {
  return (
    <div style={{
      background: '#221F1D',
      borderRadius: 16,
      padding: '30px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 24,
      marginTop: 48,
    }}>
      <div style={{ maxWidth: 600 }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: '#FAF8F5',
          marginBottom: 8,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}>
          {connected
            ? 'Vos dossiers vous attendent dans votre espace'
            : 'Vérifiez votre éligibilité en 3 minutes'}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: '#D8D2C8' }}>
          {connected
            ? 'Diagnostics, pièces à réunir et échéances de dépôt : tout est regroupé dans Mon espace.'
            : 'Répondez à quelques questions sur votre entreprise et voyez, dispositif par dispositif, où vous en êtes.'}
        </div>
      </div>
      <Link
        href={connected ? '/tableau-de-bord' : '/diagnostic'}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: 14,
          background: '#E2703A',
          color: '#FAF8F5',
          borderRadius: 10,
          padding: '15px 26px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {connected ? 'Ouvrir mon espace' : 'Faire mon diagnostic'}
      </Link>
    </div>
  )
}

export default function CatalogueCta() {
  const [email, setEmail] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Visitor state by default (HTML indexable) — switches after hydration if connected
  return <CtaBanner connected={!!email} />
}
