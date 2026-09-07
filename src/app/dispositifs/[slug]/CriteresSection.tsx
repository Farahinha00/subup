'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Critere, CritereResultat } from '@/types'
import SignalerButton from '@/components/layout/SignalerButton'

type CritereStatus = 'ok' | 'manquant' | 'bloquant'

interface Props {
  criteres: Critere[]
  dispositifId: string
  diagId?: string
}

const STATUS_ICON: Record<CritereStatus, string> = {
  ok: '✓',
  manquant: '◐',
  bloquant: '✕',
}
const STATUS_COLOR: Record<CritereStatus, string> = {
  ok: '#1F5A44',
  manquant: '#E2703A',
  bloquant: '#C9BFAE',
}

export default function CriteresSection({ criteres, dispositifId, diagId }: Props) {
  const [statusMap, setStatusMap] = useState<Record<string, CritereStatus>>({})
  const [hasDiag, setHasDiag] = useState(false)
  const [counts, setCounts] = useState({ ok: 0, manquant: 0, bloquant: 0 })

  useEffect(() => {
    if (!diagId) return
    const supabase = createClient()
    supabase
      .from('resultats')
      .select('criteres_ok, criteres_manquants, criteres_bloquants')
      .eq('diagnostic_id', diagId)
      .eq('dispositif_id', dispositifId)
      .single()
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, CritereStatus> = {}
        ;(data.criteres_ok as CritereResultat[] ?? []).forEach((c) => { map[c.id] = 'ok' })
        ;(data.criteres_manquants as CritereResultat[] ?? []).forEach((c) => { map[c.id] = 'manquant' })
        ;(data.criteres_bloquants as CritereResultat[] ?? []).forEach((c) => { map[c.id] = 'bloquant' })
        setStatusMap(map)
        setCounts({
          ok: (data.criteres_ok as CritereResultat[])?.length ?? 0,
          manquant: (data.criteres_manquants as CritereResultat[])?.length ?? 0,
          bloquant: (data.criteres_bloquants as CritereResultat[])?.length ?? 0,
        })
        setHasDiag(true)
      })
  }, [diagId, dispositifId])

  if (criteres.length === 0) return null

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: '-0.015em',
          color: '#221F1D',
          margin: 0,
        }}>
          Critères d&apos;éligibilité
        </h2>

        {/* Légende statuts — visible seulement si diagnostic chargé */}
        {hasDiag && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {counts.ok > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1F5A44', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>✓</span> {counts.ok} validé{counts.ok > 1 ? 's' : ''}
              </span>
            )}
            {counts.manquant > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#E2703A', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>◐</span> {counts.manquant} à confirmer
              </span>
            )}
            {counts.bloquant > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#8A8378', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>✕</span> {counts.bloquant} non rempli{counts.bloquant > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Liste des critères */}
      <div style={{ border: '1px solid #E7E1D9', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
        {criteres.map((c, i) => {
          const status: CritereStatus | null = hasDiag ? (statusMap[c.id] ?? null) : null
          return (
            <div
              key={c.id ?? i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '15px 18px',
                borderBottom: i < criteres.length - 1 ? '1px solid #F1EEE9' : 'none',
                background: status === 'ok' ? 'rgba(234,243,238,0.3)' : status === 'manquant' ? 'rgba(253,243,236,0.4)' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              {status ? (
                <span style={{
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: STATUS_COLOR[status],
                  marginTop: 3,
                  width: 14,
                  textAlign: 'center',
                }}>
                  {STATUS_ICON[status]}
                </span>
              ) : (
                <span style={{
                  flexShrink: 0,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#1F5A44',
                  marginTop: 7,
                  display: 'inline-block',
                }} />
              )}
              <span style={{ fontSize: 14.5, fontWeight: 600, color: '#221F1D', lineHeight: 1.5 }}>
                {c.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Info box */}
      {hasDiag ? (
        <div style={{
          marginTop: 12,
          background: '#EAF3EE',
          border: '1px solid #DCE9E2',
          borderRadius: 12,
          padding: '12px 16px',
          fontSize: 13,
          lineHeight: 1.6,
          color: '#4A453F',
        }}>
          <span style={{ fontWeight: 600, color: '#1F5A44' }}>✓ ◐ ✕</span> — Résultats basés sur votre diagnostic.{' '}
          Ces statuts reflètent les critères publiés par l&apos;opérateur, pas une décision officielle.
        </div>
      ) : (
        <div style={{
          marginTop: 12,
          background: '#FDF3EC',
          border: '1px solid #F3D9C7',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          gap: 10,
          fontSize: 13.5,
          lineHeight: 1.6,
          color: '#4A453F',
        }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: '#E2703A', flexShrink: 0 }}>i</span>
          <span>
            Ces critères sont ceux publiés par l&apos;opérateur. Savoir si{' '}
            <strong>votre</strong> entreprise les remplit relève du diagnostic, qui reste dans votre espace.
          </span>
        </div>
      )}

      {/* Encadré signalement */}
      <div style={{
        marginTop: 12,
        background: '#F1EEE9',
        border: '1px solid #E7E1D9',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        gap: 12,
        fontSize: 13.5,
        lineHeight: 1.6,
        color: '#4A453F',
      }}>
        <span style={{
          flexShrink: 0, width: 17, height: 17, borderRadius: '50%',
          border: '1.5px solid #8A8378', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#8A8378', marginTop: 2,
        }}>i</span>
        <span>
          Une information inexacte ou obsolète ?{' '}
          <SignalerButton
            label="Signalez-la à notre équipe"
            style={{ color: '#1F5A44', borderBottom: '1px solid rgba(31,90,68,0.35)', fontSize: 'inherit', fontFamily: 'inherit' }}
          />
        </span>
      </div>
    </section>
  )
}
