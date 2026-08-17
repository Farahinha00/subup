'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogoFondoukBeta } from '@/components/layout/LogoFondouk'

interface Props {
  diagnosticId: string
  dispositifId: string
  nomDispositif: string
  solde: number
}

const DEBLOQUES = [
  'Vérification guidée de votre éligibilité, critère par critère',
  'Liste personnalisée des documents à préparer',
  'Parcours de dépôt étape par étape avec conseils pratiques',
  'Dossier complet à télécharger, accessible sans limite de temps',
]

export default function DeblocageClient({ diagnosticId, dispositifId, nomDispositif, solde }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const soldeSuffisant = solde >= 1

  async function handleDebloquer() {
    if (!soldeSuffisant || loading) return
    setLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/dossier/debloquer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosticId, dispositifId }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setErreur(json.error ?? 'Une erreur est survenue.')
        setLoading(false)
        return
      }
      router.push(`/dossier/${diagnosticId}/${dispositifId}`)
    } catch {
      setErreur('Erreur réseau. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#FAF8F5', color: '#221F1D', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{ borderBottom: '1px solid #E7E1D9', background: 'rgba(250,248,245,0.92)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <LogoFondoukBeta height={42} />
          </Link>
        </div>
      </div>

      {/* Contenu centré */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 620, background: '#fff', border: '1px solid #E7E1D9', borderRadius: 20, padding: '48px 48px 40px', boxShadow: '0 4px 24px rgba(34,31,29,0.06)' }}>

          {/* Icône */}
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EAF3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 24 }}>
            📋
          </div>

          {/* Titre */}
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, margin: '0 0 10px', letterSpacing: '-0.01em' }}>
            Monter le dossier
          </h1>
          <p style={{ fontSize: 15, color: '#4A453F', lineHeight: 1.5, margin: '0 0 6px' }}>
            <strong>{nomDispositif}</strong>
          </p>
          <p style={{ fontSize: 14, color: '#6B6560', lineHeight: 1.6, margin: '0 0 28px' }}>
            Ce dossier utilise <strong>1 crédit</strong>. Il restera accessible et modifiable sans limite de temps.
          </p>

          {/* Ce qui est débloqué */}
          <div style={{ background: '#F7FAF8', border: '1px solid #DCE9E2', borderRadius: 12, padding: '20px 22px', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1F5A44', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
              Ce qui est débloqué
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEBLOQUES.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: '#4A453F', lineHeight: 1.5 }}>
                  <span style={{ color: '#1F5A44', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
                </div>
              ))}
            </div>
          </div>

          {/* Solde */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: '#6B6560', marginBottom: 28, paddingTop: 4 }}>
            <span>Solde actuel</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: '#221F1D' }}>{solde} crédit{solde !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: '#6B6560', marginBottom: 28 }}>
            <span>Solde après déblocage</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: soldeSuffisant ? '#221F1D' : '#E2703A' }}>
              {soldeSuffisant ? `${solde - 1} crédit${solde - 1 !== 1 ? 's' : ''}` : 'Solde insuffisant'}
            </span>
          </div>

          {erreur && (
            <div style={{ background: '#FFF6EF', border: '1px solid #F3D8C2', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: '#7A4A2E', marginBottom: 16 }}>
              {erreur}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleDebloquer}
            disabled={!soldeSuffisant || loading}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 11, fontSize: 15, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif", border: 'none', cursor: soldeSuffisant && !loading ? 'pointer' : 'not-allowed',
              background: soldeSuffisant && !loading ? '#1F5A44' : '#C9BFAE',
              color: '#FAF8F5', marginBottom: 16,
            }}>
            {loading ? 'Déblocage en cours…' : 'Utiliser 1 crédit et démarrer'}
          </button>

          {!soldeSuffisant && (
            <Link href="/recharger" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '13px 0', borderRadius: 11, fontSize: 14, fontWeight: 700, border: '1.5px solid #1F5A44', color: '#1F5A44', textDecoration: 'none', marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif" }}>
              Recharger des crédits
            </Link>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link
              href={`/resultats/${diagnosticId}#versionBeta`}
              style={{ fontSize: 13.5, color: '#8A8378', textDecoration: 'underline' }}>
              Revenir aux résultats
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
