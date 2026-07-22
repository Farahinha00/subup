'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LogoIcon({ size = 32, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <div
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
      className={onDark ? 'bg-fond flex items-center justify-center flex-shrink-0' : 'bg-vert flex items-center justify-center flex-shrink-0'}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 100 100">
        <polygon
          points="50,14 86,52 68,52 68,88 32,88 32,52 14,52"
          fill={onDark ? '#1F5A44' : '#FAF8F5'}
        />
      </svg>
    </div>
  )
}

export { LogoIcon }

const SIDEBAR_ROUTES = ['/tableau-de-bord', '/resultats']

export default function Header() {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (SIDEBAR_ROUTES.some((r) => pathname.startsWith(r))) return null

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-pierre" style={{ background: 'rgba(250,248,245,0.92)', backdropFilter: 'blur(10px)' }}>
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2.5">
          <LogoIcon size={32} />
          <span className="font-grotesk font-bold text-[18px] text-ardoise tracking-tight">sub&apos;up</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {!loading && (
            userEmail ? (
              <>
                <Link href="/tableau-de-bord" className="text-ardoise-clair hover:text-ardoise transition hidden sm:block font-medium">
                  Mon espace
                </Link>
                <button onClick={handleSignOut} className="text-ardoise-clair hover:text-ardoise-moyen text-xs transition hidden sm:block">
                  Déconnexion
                </button>
              </>
            ) : (
              <Link href="/connexion" className="text-ardoise-moyen hover:text-ardoise transition font-medium hidden sm:block">
                Connexion
              </Link>
            )
          )}
          <Link href="/diagnostic" className="btn-vert px-4 py-2 text-[13.5px]">
            Démarrer
          </Link>
        </nav>
      </div>
    </header>
  )
}
