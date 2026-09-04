'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  dispositifId: string
}

export default function DossierFooterFiche({ dispositifId }: Props) {
  const [connected, setConnected] = useState(false)
  const [notified, setNotified] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setConnected(!!data.user)
    })
  }, [])

  async function handleNotify() {
    if (loading || notified) return
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.from('notifications_dossier').upsert(
        { dispositif_id: dispositifId },
        { onConflict: 'dispositif_id,user_id' }
      )
    } catch {}
    setNotified(true)
    setLoading(false)
  }

  if (!connected) {
    return (
      <div style={{
        background: '#E2703A',
        borderRadius: '0 0 13px 13px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#FAF8F5', lineHeight: 1.4 }}>
          Créez votre compte pour accéder à la préparation de dossier
        </p>
        <a
          href="/inscription"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            background: '#FAF8F5',
            color: '#E2703A',
            borderRadius: 8,
            padding: '10px 16px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Créer mon compte
        </a>
      </div>
    )
  }

  return (
    <div style={{
      background: '#E2703A',
      borderRadius: '0 0 13px 13px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <p style={{ margin: 0, fontSize: 13, color: '#FAF8F5', lineHeight: 1.45, maxWidth: 340 }}>
        Le montage du dossier arrive prochainement dans votre espace. Vous serez notifié dès que c&apos;est disponible.
      </p>
      {notified ? (
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: 13,
          color: '#FAF8F5',
          padding: '10px 16px',
          border: '1.5px solid rgba(250,248,245,0.5)',
          borderRadius: 8,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          ✓ Vous serez notifié
        </span>
      ) : (
        <button
          onClick={handleNotify}
          disabled={loading}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            background: '#FAF8F5',
            color: '#E2703A',
            borderRadius: 8,
            padding: '10px 16px',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {loading ? '…' : "Être prévenu de l'ouverture"}
        </button>
      )}
    </div>
  )
}
