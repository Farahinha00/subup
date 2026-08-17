'use client'

import type { ParcoursCheckItem } from '@/types'

interface Props {
  validCriteria: string[]
  checkItems: ParcoursCheckItem[]
  checksDone: string[]
  onToggle: (id: string) => void
}

export default function Etape1Eligibilite({ validCriteria, checkItems, checksDone, onToggle }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Déjà validés par le diagnostic */}
      {validCriteria.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1F5A44', marginBottom: 12 }}>
            Déjà validé par votre diagnostic
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {validCriteria.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: '#EAF3EE', border: '1px solid #DCE9E2', borderRadius: 10, padding: '12px 16px',
              }}>
                <span style={{ color: '#1F5A44', fontWeight: 700, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 14, color: '#1F5A44', lineHeight: 1.5 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* À confirmer */}
      {checkItems.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#B8552A', marginBottom: 12 }}>
            À confirmer de votre côté
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {checkItems.map((item) => {
              const done = checksDone.includes(item.id)
              return (
                <label
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer',
                    background: done ? '#EAF3EE' : '#FFF6EF',
                    border: `1px solid ${done ? '#DCE9E2' : '#F3D8C2'}`,
                    borderRadius: 10, padding: '14px 16px',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => onToggle(item.id)}
                    style={{ width: 18, height: 18, marginTop: 2, accentColor: '#1F5A44', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: item.detail ? 4 : 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: done ? '#1F5A44' : '#221F1D', lineHeight: 1.4 }}>
                        {item.title}
                      </span>
                      {item.blocking && !done && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#E2703A', color: '#fff', borderRadius: 100, padding: '2px 8px', letterSpacing: '0.04em' }}>
                          BLOQUANT
                        </span>
                      )}
                    </div>
                    {item.detail && (
                      <p style={{ fontSize: 13, color: done ? '#1F5A44' : '#6B6560', lineHeight: 1.5, margin: 0 }}>{item.detail}</p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
