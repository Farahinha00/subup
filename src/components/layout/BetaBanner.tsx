'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// ── Screen detection ──────────────────────────────────────────────────────────

function useScreen() {
  const pathname = usePathname()
  if (pathname.startsWith('/tableau-de-bord/catalogue')) return { id: 'catalog', label: 'Catalogue' }
  if (pathname.startsWith('/resultats')) return { id: 'results', label: 'Mes résultats' }
  if (pathname.startsWith('/deblocage')) return { id: 'unlock', label: 'Déblocage' }
  if (pathname.startsWith('/dossier')) return { id: 'dossier', label: 'Dossier' }
  if (pathname.startsWith('/inscription')) return { id: 'signup', label: 'Inscription' }
  if (pathname.startsWith('/connexion')) return { id: 'signup', label: 'Connexion' }
  if (pathname.startsWith('/tableau-de-bord')) return { id: 'dashboard', label: 'Tableau de bord' }
  if (pathname.startsWith('/diagnostic')) return { id: 'diagnostic', label: 'Diagnostic' }
  if (pathname === '/') return { id: 'home', label: 'Accueil' }
  return { id: 'other', label: 'Autre' }
}

type FeedbackType = 'bug' | 'missing_info' | 'idea'

const FEEDBACK_TYPES: { id: FeedbackType; label: string }[] = [
  { id: 'bug', label: 'Bug ou blocage' },
  { id: 'missing_info', label: 'Information manquante' },
  { id: 'idea', label: 'Idée d\'amélioration' },
]

// ── BetaBanner ────────────────────────────────────────────────────────────────

export default function BetaBanner() {
  const [modalOpen, setModalOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const screen = useScreen()
  const bannerRef = useRef<HTMLDivElement>(null)

  // Expose banner height as CSS custom property so sticky tobbars below can offset
  useEffect(() => {
    const update = () => {
      if (bannerRef.current) {
        document.documentElement.style.setProperty('--banner-h', `${bannerRef.current.offsetHeight}px`)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    if (bannerRef.current) ro.observe(bannerRef.current)
    return () => ro.disconnect()
  }, [])

  function closeModal() {
    setModalOpen(false)
    if (sent) {
      setTimeout(() => { setMessage(''); setContactEmail(''); setFeedbackType('bug'); setSent(false) }, 300)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: feedbackType, message: message.trim(), contact_email: contactEmail.trim() || null, screen: screen.id }),
      })
      setSent(true)
    } catch {
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* ── Bandeau ── */}
      <div ref={bannerRef} style={{ background: '#221F1D', width: '100%' }}>
        <div style={{
          maxWidth: 1320, margin: '0 auto', padding: '10px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, flexWrap: 'nowrap',
        }}>
          <span style={{
            background: '#E2703A', color: '#221F1D', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 100,
            padding: '3px 9px', flexShrink: 0,
          }}>
            Version bêta
          </span>
          <span style={{ fontSize: 13.5, color: '#D8D2C8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            Fondouk est en cours de développement — certaines informations peuvent être incomplètes.
          </span>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              fontSize: 13.5, fontWeight: 700, color: '#FAF8F5',
              background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
              textDecoration: 'underline', textDecorationColor: 'rgba(250,248,245,0.3)',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#E2703A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#FAF8F5')}
          >
            Faire un retour →
          </button>
        </div>
      </div>

      {/* ── Modale ── */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(34,31,29,.55)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 560, boxShadow: '0 24px 60px rgba(34,31,29,.22)' }}
          >
            {sent ? (
              /* État confirmation */
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EAF3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 16px', color: '#1F5A44', fontWeight: 700 }}>✓</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>Retour enregistré</div>
                <p style={{ fontSize: 14, color: '#6B6560', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: 420 }}>
                  Merci — il rejoint la file de traitement de l&apos;équipe, au même titre que les signalements d&apos;information erronée.
                </p>
                <button onClick={closeModal} style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5, background: '#1F5A44', color: '#FAF8F5', border: 'none', borderRadius: 10, padding: '11px 24px', cursor: 'pointer' }}>
                  Fermer
                </button>
              </div>
            ) : (
              /* État formulaire */
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19 }}>Faire un retour</span>
                  <button type="button" onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#8A8378', lineHeight: 1, padding: '0 4px' }}>×</button>
                </div>
                <p style={{ fontSize: 13.5, color: '#6B6560', lineHeight: 1.55, marginBottom: 20 }}>
                  Fondouk est en bêta : bug, information manquante, idée d&apos;amélioration — tout nous est utile.
                </p>

                {/* Type */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {FEEDBACK_TYPES.map((t) => (
                    <button
                      key={t.id} type="button" onClick={() => setFeedbackType(t.id)}
                      style={{
                        fontSize: 13, fontWeight: 600, padding: '7px 13px', borderRadius: 100, cursor: 'pointer',
                        background: feedbackType === t.id ? '#1F5A44' : '#fff',
                        color: feedbackType === t.id ? '#FAF8F5' : '#4A453F',
                        border: `1px solid ${feedbackType === t.id ? '#1F5A44' : '#E7E1D9'}`,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#4A453F', marginBottom: 6 }}>
                    Message <span style={{ color: '#E2703A' }}>*</span>
                  </label>
                  <textarea
                    required value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder={feedbackType === 'bug' ? 'Décrivez ce qui s\'est passé et ce que vous attendiez…' : feedbackType === 'missing_info' ? 'Quelle information manquait ou était incorrecte ?' : 'Quelle amélioration suggérez-vous ?'}
                    style={{ width: '100%', minHeight: 120, fontFamily: "'Inter', sans-serif", fontSize: 13.5, padding: '10px 12px', border: '1px solid #E7E1D9', borderRadius: 10, background: '#FAF8F5', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Email optionnel */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#4A453F', marginBottom: 6 }}>
                    Email de contact <span style={{ fontSize: 12, color: '#8A8378', fontWeight: 400 }}>(facultatif)</span>
                  </label>
                  <input
                    type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Pour qu'on puisse vous répondre"
                    style={{ width: '100%', fontFamily: "'Inter', sans-serif", fontSize: 13.5, padding: '10px 12px', border: '1px solid #E7E1D9', borderRadius: 10, background: '#FAF8F5', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Pied */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, color: '#8A8378' }}>Écran : {screen.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button type="button" onClick={closeModal} style={{ fontSize: 13.5, fontWeight: 600, color: '#6B6560', background: 'none', border: 'none', cursor: 'pointer', padding: '9px 4px' }}>
                      Annuler
                    </button>
                    <button
                      type="submit" disabled={!message.trim() || sending}
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5,
                        padding: '9px 18px', borderRadius: 9, border: 'none',
                        background: message.trim() ? '#1F5A44' : '#E7E1D9',
                        color: message.trim() ? '#FAF8F5' : '#A8A199',
                        cursor: message.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {sending ? 'Envoi…' : 'Envoyer le retour'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
