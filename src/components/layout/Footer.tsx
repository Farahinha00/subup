'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoFondoukBeta } from '@/components/layout/LogoFondouk'

const SIDEBAR_ROUTES = ['/tableau-de-bord', '/resultats', '/diagnostic', '/inscription', '/dispositifs']

export default function Footer() {
  const pathname = usePathname()
  if (SIDEBAR_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <footer className="border-t border-pierre mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start justify-between gap-8">
        <LogoFondoukBeta height={42} />
        </div>
      <div className="border-t border-pierre py-4 text-center text-xs text-ardoise-clair">
        © {new Date().getFullYear()} Fondouk · Informations indicatives — vérifiez les critères auprès des organismes officiels.
      </div>
    </footer>
  )
}
