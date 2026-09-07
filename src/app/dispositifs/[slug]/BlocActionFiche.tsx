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

interface DiagResult {
  score: number
  titre: string | null
}

interface Props {
  dispositifId: string
  dispositifNom: string
  dispositifSlug: string
  diagId?: string
}

export default function BlocActionFiche({ dispositifId, dispositifNom, dispositifSlug, diagId }: Props) {
  const [status, setStatus] = useState<'loading' | 'visitor' | 'connected' | 'diag'>('loading')
  const [projets, setProjets] = useState<ProjetEligibilite[]>([])
  const [totalProjets, setTotalProjets] = useState(0)
  const [diagResult, setDiagResult] = useState<DiagResult | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('visitor'); return }

      // Contexte diagnostic : afficher le score + le titre du projet
      if (diagId) {
        const [{ data: result }, { data: diag }] = await Promise.all([
          supabase.from('resultats').select('score').eq('diagnostic_id', diagId).eq('dispositif_id', dispositifId).single(),
          supabase.from('diagnostics').select('titre').eq('id', diagId).single(),
        ])
        setDiagResult({
          score: result ? Math.round(result.score) : 0,
          titre: diag?.titre ?? null,
        })
        setStatus('diag')
        return
      }

      // Mode normal : liste des projets pour ce dispositif
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
      setStatus('connected')
    }

    load()
  }, [dispositifId, diagId])

  if (status === 'loading' || status === 'visitor') {
    return <BlocVisiteur dispositifNom={dispositifNom} dispositifSlug={dispositifSlug} />
  }

  if (status === 'diag') {
    return (
      <BlocConnecteDiag
        result={diagResult}
        diagId={diagId!}
        dispositifNom={dispositifNom}
        dispositifSlug={dispositifSlug}
      />
    )
  }

  const surplus = totalProjets - 3

  return (
    <div style={cardStyle}>
      <div>
        <p style={titleStyle}>
          Évaluer {dispositifNom} pour…
        </p>
        {projets.length > 0 && (
          <p style={{ fontSize: 13, lineHeight: 1.5, color: '#D8D2C8', margin: 0 }}>
            Vos projets les plus éligibles à ce dispositif :
          </p>
        )}
      </div>

      {projets.length === 0 && (
        <p style={{ fontSize: 13, color: '#A8A199', margin: 0, lineHeight: 1.5 }}>
          Vous n&apos;avez pas encore lancé de diagnostic pour ce dispositif.
        </p>
      )}

      {projets.length > 0 && (
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
      )}

      {surplus > 0 && (
        <Link href="/tableau-de-bord/diagnostics"
          style={{ fontSize: 12.5, fontWeight: 600, color: '#A8A199', textDecoration: 'none', textAlign: 'center' }}>
          Voir mes {surplus} autre{surplus > 1 ? 's' : ''} projet{surplus > 1 ? 's' : ''} →
        </Link>
      )}

      <Link href={`/diagnostic?dispositif=${dispositifSlug}`} style={ctaStyle}>
        Nouveau diagnostic
      </Link>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#8A8378', margin: 0 }}>
        Vos diagnostics restent privés
      </p>
    </div>
  )
}

// ── Bloc connecté via diagnostic ──────────────────────────────────────────────

function BlocConnecteDiag({
  result, diagId, dispositifNom, dispositifSlug,
}: {
  result: DiagResult | null
  diagId: string
  dispositifNom: string
  dispositifSlug: string
}) {
  const score = result?.score ?? 0
  const titre = result?.titre

  return (
    <div style={cardStyle}>
      <p style={titleStyle}>
        Votre éligibilité à {dispositifNom}
      </p>

      <div style={{ textAlign: 'center', padding: '4px 0 4px' }}>
        {titre && (
          <div style={{ fontSize: 13, color: '#A8A199', marginBottom: 6 }}>
            &laquo;&nbsp;{titre}&nbsp;&raquo; est éligible à
          </div>
        )}
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1,
          color: score >= 70 ? '#7BC49A' : '#E2703A',
        }}>
          {score}%
        </div>
        <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 8 }}>
          ✦ Estimation basée sur votre diagnostic
        </div>
      </div>

      <Link
        href={`/resultats/${diagId}`}
        style={{
          display: 'block',
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: '#A8A199',
          textDecoration: 'none',
          border: '1px solid #4A453F',
          borderRadius: 9,
          padding: '10px 14px',
        }}
      >
        ← Voir tous mes résultats
      </Link>

      <Link href={`/diagnostic?dispositif=${dispositifSlug}`} style={ctaStyle}>
        Nouveau diagnostic
      </Link>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#8A8378', margin: 0 }}>
        Vos diagnostics restent privés
      </p>
    </div>
  )
}

// ── Bloc visiteur ─────────────────────────────────────────────────────────────

function BlocVisiteur({ dispositifNom, dispositifSlug }: { dispositifNom: string; dispositifSlug: string }) {
  return (
    <div style={cardStyle}>
      <div>
        <p style={titleStyle}>
          Ce dispositif est-il pour vous ?
        </p>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#D8D2C8', margin: 0 }}>
          Répondez à quelques questions sur votre entreprise : Fondouk vous dit où vous en êtes sur {dispositifNom}, critère par critère.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[
          { n: '01', label: 'Votre entreprise : forme, âge, effectif' },
          { n: '02', label: 'Votre projet et le montant envisagé' },
          { n: '03', label: 'Vos résultats, dispositif par dispositif' },
        ].map((s) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #4A453F', borderRadius: 9, padding: '9px 12px' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11.5, color: '#E2703A', flexShrink: 0 }}>
              {s.n}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#D8D2C8' }}>{s.label}</span>
          </div>
        ))}
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

// ── Styles partagés ───────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#221F1D',
  borderRadius: 16,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const titleStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: 20,
  color: '#FAF8F5',
  margin: 0,
  lineHeight: 1.3,
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
