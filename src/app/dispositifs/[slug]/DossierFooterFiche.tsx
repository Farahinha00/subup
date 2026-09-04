'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  dispositifId: string
}

const footerStyle: React.CSSProperties = {
  background: '#F1EEE9',
  borderTop: '1px solid #E7E1D9',
  borderRadius: '0 0 13px 13px',
  padding: '18px 22px',
}

const btnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'center',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600,
  fontSize: 13.5,
  background: '#221F1D',
  color: '#FAF8F5',
  borderRadius: 9,
  padding: '12px 20px',
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
}

export default function DossierFooterFiche({ dispositifId }: Props) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [notified, setNotified] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setConnected(!!data.user))
  }, [dispositifId])

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

  // Chargement — on rend l'état visiteur par défaut (SSR-safe)
  if (connected === null || !connected) {
    return (
      <div style={footerStyle}>
        <p style={{ fontSize: 13.5, color: '#4A453F', margin: '0 0 14px', lineHeight: 1.55 }}>
          Le montage du dossier arrive prochainement dans votre espace : checklist des pièces, modèles à jour et suivi du dépôt. Nous vous prévenons dès l&apos;ouverture.
        </p>
        <Link href="/inscription" style={btnStyle}>
          Créer mon compte pour y accéder
        </Link>
      </div>
    )
  }

  return (
    <div style={footerStyle}>
      <p style={{ fontSize: 13.5, color: '#4A453F', margin: '0 0 14px', lineHeight: 1.55 }}>
        Le montage du dossier arrive prochainement dans votre espace : checklist des pièces, modèles à jour et suivi du dépôt. Nous vous prévenons dès l&apos;ouverture.
      </p>
      {notified ? (
        <div style={{ ...btnStyle, background: '#EAF3EE', color: '#1F5A44', cursor: 'default' }}>
          ✓ Vous serez notifié à l&apos;ouverture
        </div>
      ) : (
        <button onClick={handleNotify} disabled={loading} style={{ ...btnStyle, width: '100%' }}>
          {loading ? '…' : "Être prévenu de l'ouverture"}
        </button>
      )}
    </div>
  )
}
