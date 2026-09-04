'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/layout/LogoFondouk'
import { createClient } from '@/lib/supabase/client'

export default function PublicNav() {
  const [email, setEmail] = useState<string | null | undefined>(undefined)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = pathname
  }

  return (
    <nav style={{
      background: 'rgba(250,248,245,0.95)',
      borderBottom: '1px solid #E7E1D9',
      position: 'sticky',
      top: 'var(--banner-h, 0px)',
      zIndex: 20,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        maxWidth: 1152,
        margin: '0 auto',
        padding: '0 24px',
        height: 72,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo size="nav" variant="beta" />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* undefined = en cours de chargement, on ne rend rien pour éviter le flash */}
          {email === undefined ? null : email ? (
            <>
              <Link href="/tableau-de-bord"
                style={{ fontSize: 13.5, fontWeight: 600, color: '#4A453F', textDecoration: 'none' }}>
                Mon espace
              </Link>
              <button
                onClick={handleSignOut}
                style={{ fontSize: 13, fontWeight: 500, color: '#8A8378', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/connexion?redirect=${encodeURIComponent(pathname)}`}
                style={{ fontSize: 13.5, fontWeight: 600, color: '#4A453F', textDecoration: 'none' }}>
                Connexion
              </Link>
              <Link
                href="/diagnostic"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: 13.5,
                  background: '#E2703A',
                  color: '#FAF8F5',
                  borderRadius: 9,
                  padding: '10px 17px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Faire mon diagnostic
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
