import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BetaBanner from '@/components/layout/BetaBanner'
import { Analytics } from '@vercel/analytics/next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fondouk.ma'

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'Fondouk — Trouvez les aides publiques auxquelles vous avez droit',
    template: '%s · Fondouk',
  },
  description:
    'Diagnostic gratuit. Fondouk identifie les aides publiques marocaines accessibles à votre entreprise : Charte TPME, MOWAKABA, ISTITMAR, Innov Invest, Digital PME.',
  keywords: ['aides publiques Maroc', 'subventions entreprise Maroc', 'TPME', 'MOWAKABA', 'ISTITMAR', 'Innov Invest', 'financement PME Maroc'],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    url: BASE,
    siteName: 'Fondouk',
    title: 'Fondouk — Trouvez les aides publiques auxquelles vous avez droit',
    description: 'Diagnostic gratuit. Fondouk identifie les aides publiques marocaines accessibles à votre entreprise.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fondouk — Aides publiques Maroc',
    description: 'Diagnostic gratuit. Trouvez les subventions accessibles à votre entreprise au Maroc.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex flex-col min-h-screen">
        <div style={{ position: 'sticky', top: 0, zIndex: 30 }}>
          <BetaBanner />
          <Header />
        </div>
        <main className="flex-1 flex flex-col min-h-0">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
