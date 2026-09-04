'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ProjetEligibilite {
  diagnosticId: string
  titre: string
  date: string
  score: number
}

interface Props {
  dispositifId: string
  dispositifNom: string
  dispositifSlug: string
}

export default function BlocActionFiche({ dispositifId, dispositifNom, dispositifSlug }: Props) {
  const [status, setStatus] = useState<'loading' | 'visitor' | 'connected'>('loading')
  const [projets, setProjets] = useState<ProjetEligibilite[]>([])
  const [totalProjets, setTotalProjets] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('visitor'); return }

      const [{ data: diags }, { data: results }] = await Promise.all([
        supabase.from('diagnostics').select('id, titre, created_at').order('created_at', { ascending: false }),
        supabase.from('resultats').select('diagnostic_id, score').eq('dispositif_id', dispositifId),
      ])

      if (!diags || !results) { setStatus('visitor'); return }

      const scoreByDiag = Object.fromEntries(results.map((r) => [r.diagnostic_id, r.score]))
      const matches = diags
        .filter((d) => scoreByDiag[d.id] !== undefined)
        .map((d) => ({
          diagnosticId: d.id,
          titre: d.titre ?? 'Diagnostic sans titre',
          date: new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
          score: Math.round(scoreByDiag[d.id]),
        }))
        .sort((a, b) => b.score - a.score)

      setTotalProjets(matches.length)
      setProjets(matches.slice(0, 3))
      setStatus(matches.length > 0 ? 'connected' : 'visitor')
    }

    load()
  }, [dispositifId])

  if (status === 'loading' || status === 'visitor') {
    return <BlocVisiteur dispositifNom={dispositifNom} dispositifSlug={dispositifSlug} />
  }

  const surplus = totalProjets - 3

  return (
    <div style={cardStyle}>
      <div>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#FAF8F5', margin: '0 0 6px', lineHeight: 1.3 }}>
          Évaluer {dispositifNom} pour…
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: '#D8D2C8', margin: 0 }}>
          Vos projets les plus éligibles à ce dispositif :
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {projets.map((p) => (
          <Link
            key={p.diagnosticId}
            href={`/resultats/${p.diagnosticId}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              border: '1px solid #4A453F',
              borderRadius: 9,
              padding: '11px 13px',
              textDecoration: 'none',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FAF8F5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.titre}
              </div>
              <div style={{ fontSize: 11.5, color: '#A8A199', marginTop: 2 }}>{p.date}</div>
            </div>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              flexShrink: 0,
              color: p.score >= 70 ? '#7BC49A' : '#E2703A',
            }}>
              {p.score}%
            </span>
          </Link>
        ))}
      </div>

      {surplus > 0 && (
        <Link href="/tableau-de-bord/diagnostics"
          style={{ fontSize: 12.5, fontWeight: 600, color: '#A8A199', textDecoration: 'none', textAlign: 'center' }}>
          Voir mes {surplus} autre{surplus > 1 ? 's' : ''} projet{surplus > 1 ? 's' : ''} →
        </Link>
      )}

      <Link
        href={`/diagnostic?dispositif=${dispositifSlug}`}
        style={ctaStyle}
      >
        Nouveau diagnostic
      </Link>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#8A8378', margin: 0 }}>
        Vos diagnostics restent privés
      </p>
    </div>
  )
}

function BlocVisiteur({ dispositifNom, dispositifSlug }: { dispositifNom: string; dispositifSlug: string }) {
  return (
    <div style={cardStyle}>
      <div>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#FAF8F5', margin: '0 0 8px', lineHeight: 1.3 }}>
          Ce dispositif est-il pour vous ?
        </p>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#D8D2C8', margin: 0 }}>
          Répondez à quelques questions sur votre entreprise : Fondouk vous dit où vous en êtes sur {dispositifNom}, critère par critère.
        </p>
      </div>
      <Link href={`/diagnostic?dispositif=${dispositifSlug}`} style={ctaStyle}>
        Vérifier mon éligibilité — 3 min
      </Link>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#8A8378', margin: 0 }}>
        Gratuit, sans engagement
      </p>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#221F1D',
  borderRadius: 16,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const ctaStyle: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  background: '#E2703A',
  color: '#FAF8F5',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600,
  fontSize: 14,
  borderRadius: 10,
  padding: '14px 20px',
  textDecoration: 'none',
}
