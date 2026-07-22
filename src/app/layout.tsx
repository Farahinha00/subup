import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Sub\'up Morocco — Trouvez les aides auxquelles vous avez droit',
  description:
    'Diagnostic gratuit. Découvrez les aides publiques marocaines accessibles à votre entreprise : Charte TPME, MOWAKABA, ISTITMAR, Innov Invest, Digital PME.',
  robots: 'index, follow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
