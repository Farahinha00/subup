'use client'

import { useState } from 'react'

interface Props {
  dispositifId: string
  type: 'document' | 'etape'
}

export default function SignalementForm({ dispositifId, type }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [texte, setTexte] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [textesEnvoyes, setTextesEnvoyes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const label = type === 'document' ? 'document' : 'étape'

  async function handleEnvoyer() {
    if (!texte.trim() || loading) return
    setLoading(true)
    await fetch('/api/dossier/signalement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispositifId, type, texte }),
    })
    setTextesEnvoyes((prev) => [...prev, texte.trim()])
    setTexte('')
    setOuvert(false)
    setLoading(false)
  }

  return (
    <div style={{ marginTop: 8 }}>
      {textesEnvoyes.map((t, i) => (
        <div key={i} style={{ background: '#FFF6EF', border: '1px solid #F3D8C2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#7A4A2E', marginBottom: 8, lineHeight: 1.5 }}>
          « {t} » — signalé, en cours de vérification par notre équipe.
        </div>
      ))}

      {!ouvert ? (
        <button
          onClick={() => setOuvert(true)}
          style={{ fontSize: 13, color: '#8A8378', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
          + On vous a demandé un {label} qui n&apos;est pas dans la liste ?
        </button>
      ) : (
        <div style={{ background: '#F1EEE9', borderRadius: 12, padding: '16px', marginTop: 8 }}>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder={`Décrivez le ${label} manquant…`}
            rows={3}
            style={{ width: '100%', borderRadius: 8, border: '1px solid #C9BFAE', padding: '10px 12px', fontSize: 13.5, fontFamily: "'Inter', sans-serif", resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={handleEnvoyer}
              disabled={!texte.trim() || loading}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: texte.trim() && !loading ? 'pointer' : 'not-allowed',
                background: texte.trim() && !loading ? '#1F5A44' : '#C9BFAE', color: '#fff',
              }}>
              Envoyer
            </button>
            <button
              onClick={() => { setOuvert(false); setTexte('') }}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #C9BFAE', background: '#fff', color: '#6B6560', cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
