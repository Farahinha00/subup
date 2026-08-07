'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoFondoukBeta } from '@/components/layout/LogoFondouk'

const SIDEBAR_ROUTES = ['/tableau-de-bord', '/resultats']

export default function Footer() {
  const pathname = usePathname()
  if (SIDEBAR_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <footer className="border-t border-pierre mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start justify-between gap-8">
        <LogoFondoukBeta height={28} />
        <div className="flex gap-12 text-sm">
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-ardoise-clair">Produit</span>
            <Link href="/catalogue" className="text-ardoise-moyen hover:text-ardoise transition">Dispositifs</Link>
            <Link href="/diagnostic" className="text-ardoise-moyen hover:text-ardoise transition">Diagnostic</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-pierre py-4 text-center text-xs text-ardoise-clair">
        © {new Date().getFullYear()} Fondouk · Casablanca, Maroc
        <span className="mx-3">·</span>
        Informations indicatives — vérifiez les critères auprès des organismes officiels.
      </div>
    </footer>
  )
}
