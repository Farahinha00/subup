import Link from 'next/link'
import { Logo } from '@/components/layout/LogoFondouk'

function PublicNav() {
  return (
    <nav
      style={{
        background: 'rgba(250,248,245,0.95)',
        borderBottom: '1px solid #E7E1D9',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
        position: 'sticky',
        top: 'var(--banner-h, 0px)',
        zIndex: 20,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Link href="/dispositifs" style={{ textDecoration: 'none' }}>
        <Logo size="nav" variant="beta" />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/connexion"
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
      </div>
    </nav>
  )
}

function PublicFooter() {
  return (
    <footer style={{
      background: '#F1EEE9',
      borderTop: '1px solid #E7E1D9',
      padding: '26px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16,
    }}>
      <span style={{ fontSize: 13, color: '#8A8378' }}>
        Fondouk — catalogue des dispositifs d&apos;aide publique aux entreprises au Maroc.
      </span>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/dispositifs" style={{ fontSize: 13, fontWeight: 500, color: '#6B6560', textDecoration: 'none' }}>
          Tous les dispositifs
        </Link>
        <a href="mailto:corrections@fondouk.ma"
          style={{ fontSize: 13, fontWeight: 600, color: '#1F5A44', textDecoration: 'none' }}>
          Signaler une erreur
        </a>
      </div>
    </footer>
  )
}

export default function DispositifsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FAF8F5' }}>
      <PublicNav />
      <main style={{ flex: 1 }}>{children}</main>
      <PublicFooter />
    </div>
  )
}
