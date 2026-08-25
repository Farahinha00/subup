'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoFondoukBetaDark } from '@/components/layout/LogoFondouk'

const NAV = [
  { label: 'Tableau de bord', href: '/tableau-de-bord', exact: true },
  { label: 'Diagnostics', href: '/tableau-de-bord/diagnostics' },
  { label: 'Catalogue', href: '/tableau-de-bord/catalogue' },
]

function initiales(prenom?: string | null, nom?: string | null, email?: string | null) {
  if (prenom && nom) return (prenom[0] + nom[0]).toUpperCase()
  if (prenom) return prenom.slice(0, 2).toUpperCase()
  return (email ?? 'U').slice(0, 2).toUpperCase()
}

export default function Sidebar() {
  const pathname = usePathname()
  const [ini, setIni] = useState('…')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? null)
      supabase.from('profiles').select('prenom, nom').eq('id', user.id).single()
        .then(({ data }) => setIni(initiales(data?.prenom, data?.nom, user.email)))
    })
  }, [])

  return (
    <aside
      className="w-[240px] flex-shrink-0 flex flex-col"
      style={{ backgroundColor: 'var(--vert)', height: '100%', overflow: 'hidden' }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <Link href="/" className="flex items-center">
          <LogoFondoukBetaDark height={46} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] transition-colors"
              style={
                isActive
                  ? { backgroundColor: 'rgba(255,255,255,0.12)', color: 'var(--fond)', fontWeight: 500 }
                  : { color: 'rgba(234,243,238,0.7)' }
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isActive ? 'var(--corail)' : 'rgba(234,243,238,0.3)' }}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Profil */}
      <div className="px-3 pb-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
        <Link
          href="/tableau-de-bord/profil"
          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors"
          style={
            pathname === '/tableau-de-bord/profil'
              ? { backgroundColor: 'rgba(255,255,255,0.12)' }
              : {}
          }
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-grotesk font-bold text-[11px] flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--fond)' }}
          >
            {ini}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium truncate" style={{ color: 'var(--fond)' }}>Mon profil</div>
            {email && <div className="text-[10px] truncate" style={{ color: 'rgba(234,243,238,0.5)' }}>{email}</div>}
          </div>
        </Link>
      </div>
    </aside>
  )
}
