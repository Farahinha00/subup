'use client'

import type { ParcoursDepotStep } from '@/types'
import SignalementForm from './SignalementForm'

interface Props {
  steps: ParcoursDepotStep[]
  depositDone: string[]
  dispositifId: string
  onToggle: (id: string) => void
}

export default function Etape3Depot({ steps, depositDone, dispositifId, onToggle }: Props) {
  return (
    <div>
      <div style={{ position: 'relative', paddingLeft: 40 }}>
        {steps.map((step, i) => {
          const done = depositDone.includes(step.id)
          const isLast = i === steps.length - 1
          return (
            <div key={step.id} style={{ position: 'relative', marginBottom: isLast ? 0 : 28 }}>
              {/* Trait vertical */}
              {!isLast && (
                <div style={{
                  position: 'absolute', left: -25, top: 30, width: 2, height: 'calc(100% + 4px)',
                  background: done ? '#1F5A44' : '#E7E1D9',
                  transition: 'background 0.3s',
                }} />
              )}
              {/* Pastille cliquable */}
              <button
                onClick={() => onToggle(step.id)}
                aria-label={`${done ? 'Décocher' : 'Cocher'} : ${step.title}`}
                style={{
                  position: 'absolute', left: -36, top: 0,
                  width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
                  background: done ? '#1F5A44' : '#fff', border: `2px solid ${done ? '#1F5A44' : '#C9BFAE'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: done ? '#fff' : '#6B6560',
                  transition: 'all 0.2s',
                }}>
                {done ? '✓' : i + 1}
              </button>

              {/* Contenu */}
              <div style={{
                borderRadius: 12, padding: '18px 20px',
                border: `1px solid ${done ? '#DCE9E2' : '#E7E1D9'}`,
                background: done ? '#F7FAF8' : '#fff',
              }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: done ? '#1F5A44' : '#221F1D', marginBottom: step.description ? 6 : 0 }}>
                  {step.title}
                </div>
                {step.description && (
                  <p style={{ fontSize: 13.5, color: '#4A453F', lineHeight: 1.6, margin: '0 0 12px' }}>{step.description}</p>
                )}
                {step.tip && (
                  <div style={{ background: '#FFF6EF', border: '1px solid #F3D8C2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#7A4A2E', lineHeight: 1.5, marginBottom: step.actionLabel ? 12 : 0 }}>
                    💡 {step.tip}
                  </div>
                )}
                {step.actionLabel && step.actionHref && (
                  <a
                    href={step.actionHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13.5, color: '#1F5A44', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    ↗ {step.actionLabel}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 32 }}>
        <SignalementForm dispositifId={dispositifId} type="etape" />
      </div>
    </div>
  )
}
