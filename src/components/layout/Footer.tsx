'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SIDEBAR_ROUTES = ['/tableau-de-bord', '/resultats']

export default function Footer() {
  const pathname = usePathname()
  if (SIDEBAR_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <footer className="border-t border-pierre mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start justify-between gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-vert flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 100 100">
              <polygon points="50,14 86,52 68,52 68,88 32,88 32,52 14,52" fill="#FAF8F5" />
            </svg>
          </div>
          <span className="font-grotesk font-bold text-[16px] text-ardoise">sub&apos;up</span>
        </div>
        <div className="flex gap-12 text-sm">
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-ardoise-clair">Produit</span>
            <Link href="/catalogue" className="text-ardoise-moyen hover:text-ardoise transition">Dispositifs</Link>
            <Link href="/diagnostic" className="text-ardoise-moyen hover:text-ardoise transition">Diagnostic</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-pierre py-4 text-center text-xs text-ardoise-clair">
        © {new Date().getFullYear()} Sub&apos;up · Casablanca, Maroc
        <span className="mx-3">·</span>
        Informations indicatives — vérifiez les critères auprès des organismes officiels.
      </div>
    </footer>
  )
}
