'use client'

import { useState } from 'react'
import type { ParcoursDoc } from '@/types'
import SignalementForm from './SignalementForm'

interface Props {
  docs: ParcoursDoc[]
  docsDone: string[]
  dispositifId: string
  onToggle: (id: string) => void
}

const TAG_LABELS: Record<ParcoursDoc['tag'], string> = {
  have: 'Déjà en votre possession',
  obtain: 'À obtenir auprès d\'un tiers',
  generate: 'Généré automatiquement',
}

const TAG_COLORS: Record<ParcoursDoc['tag'], { bg: string; color: string; border: string }> = {
  have: { bg: '#F1EEE9', color: '#6B6560', border: '#E7E1D9' },
  obtain: { bg: '#FFF6EF', color: '#B8552A', border: '#F3D8C2' },
  generate: { bg: '#EAF3EE', color: '#1F5A44', border: '#DCE9E2' },
}

export default function Etape2Documents({ docs, docsDone, dispositifId, onToggle }: Props) {
  const prets = docsDone.length
  const total = docs.length

  return (
    <div>
      {/* Compteur + barre */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>
            {prets}/{total} prêts
          </span>
          <span style={{ fontSize: 13, color: '#8A8378' }}>{total - prets} restant{total - prets !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ height: 6, background: '#F1EEE9', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${total > 0 ? (prets / total) * 100 : 0}%`, background: '#1F5A44', borderRadius: 100, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Liste documents */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {docs.map((doc) => {
          const done = docsDone.includes(doc.id)
          const colors = TAG_COLORS[doc.tag]
          return (
            <label key={doc.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
              background: '#fff', border: '1px solid #E7E1D9', borderRadius: 12, padding: '14px 16px',
              opacity: done ? 0.8 : 1,
            }}>
              <input
                type="checkbox"
                checked={done}
                onChange={() => onToggle(doc.id)}
                style={{ width: 18, height: 18, accentColor: '#1F5A44', flexShrink: 0, cursor: 'pointer' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#221F1D', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.4 }}>
                  {doc.name}
                </div>
                <div style={{ fontSize: 12, color: colors.color, marginTop: 2 }}>
                  {TAG_LABELS[doc.tag]}
                </div>
              </div>
              {/* Statut / bouton */}
              <div style={{ flexShrink: 0 }}>
                {done ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1F5A44', background: '#EAF3EE', border: '1px solid #DCE9E2', borderRadius: 100, padding: '4px 10px' }}>
                    Prêt ✓
                  </span>
                ) : (
                  <span style={{
                    fontSize: 12.5, fontWeight: 700, borderRadius: 8, padding: '6px 12px', border: '1.5px solid',
                    borderColor: doc.tag === 'generate' ? '#1F5A44' : doc.tag === 'obtain' ? '#E2703A' : '#C9BFAE',
                    color: doc.tag === 'generate' ? '#1F5A44' : doc.tag === 'obtain' ? '#E2703A' : '#6B6560',
                    background: doc.tag === 'generate' ? '#EAF3EE' : '#fff',
                  }}>
                    {doc.tag === 'have' ? 'Téléverser' : doc.tag === 'obtain' ? 'Où l\'obtenir' : 'Télécharger'}
                  </span>
                )}
              </div>
            </label>
          )
        })}
      </div>

      <SignalementForm dispositifId={dispositifId} type="document" />
    </div>
  )
}
