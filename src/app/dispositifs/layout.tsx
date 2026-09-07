import Link from 'next/link'
import PublicNav from './PublicNav'
import SignalerButton from '@/components/layout/SignalerButton'

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
        <SignalerButton
          label="Signaler une erreur"
          style={{ fontSize: 13, fontWeight: 600, color: '#1F5A44', fontFamily: 'inherit' }}
        />
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
