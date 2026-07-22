'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Tableau de bord', href: '/tableau-de-bord' },
  { label: 'Dispositifs', href: '/catalogue' },
  { label: 'Diagnostic', href: '/diagnostic' },
  { label: 'Mes dossiers', href: '/tableau-de-bord' },
  { label: 'Documents', href: '/tableau-de-bord/documents-entreprise' },
  { label: 'Paramètres', href: '/tableau-de-bord/parametres' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col" style={{ backgroundColor: 'var(--vert)', minHeight: '100vh' }}>
      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--fond)' }}
          >
            <svg width="14" height="14" viewBox="0 0 100 100">
              <polygon points="50,14 86,52 68,52 68,88 32,88 32,52 14,52" fill="#1F5A44" />
            </svg>
          </div>
          <span className="font-grotesk font-bold text-[16px]" style={{ color: 'var(--fond)' }}>sub&apos;up</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const isActive = item.href && (pathname === item.href || pathname.startsWith(item.href + '/'))
          const isDisabled = !item.href

          if (isDisabled) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] select-none"
                style={{ color: 'rgba(234,243,238,0.35)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(234,243,238,0.2)' }} />
                {item.label}
              </div>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
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

      {/* Upsell */}
      <div className="m-3 p-4 rounded-[14px]" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(234,243,238,0.6)' }}>
          Passez au plan Cabinet pour gérer plusieurs clients.
        </p>
        <span className="text-[12px] font-semibold" style={{ color: 'var(--corail)' }}>Découvrir →</span>
      </div>
    </aside>
  )
}
