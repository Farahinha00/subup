'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

const MIN_CHARS = 50
const MAX_CHARS = 2000

interface Props {
  onAnalyser: (texte: string) => void
  onWizardClassique: () => void
  loading: boolean
  erreur?: string | null
}


export default function WizardTextLibre({ onAnalyser, onWizardClassique, loading, erreur }: Props) {
  const [texte, setTexte] = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const counterId = useId()
  const count = texte.length
  const ok = count >= MIN_CHARS && !loading

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => { resize() }, [texte, resize])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && ok) {
      e.preventDefault()
      onAnalyser(texte)
    }
  }

  let counterColor = '#8A8378'
  let counterText = `${MIN_CHARS} caractères minimum`
  if (count > 0 && count < MIN_CHARS) {
    counterColor = '#B4562A'
    counterText = `Encore ${MIN_CHARS - count} car.`
  } else if (count >= MIN_CHARS) {
    counterColor = '#1F5A44'
    counterText = `${count} / ${MAX_CHARS}`
  }

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F5F1EA',
        padding: '0 24px 48px',
        boxSizing: 'border-box',
      }}
    >
      {/* Content column */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '66.666%',
          width: '100%',
          margin: '0 auto',
          paddingTop: 48,
        }}
      >
        {/* Pill eyebrow */}
        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              backgroundColor: '#FFF1E7',
              border: '1px solid #F3D8C2',
              borderRadius: 99,
              padding: '4px 12px 4px 10px',
              fontSize: 12.5,
              fontWeight: 500,
              color: '#B4562A',
              letterSpacing: '0.01em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <span
              style={{
                width: 6, height: 6,
                borderRadius: '50%',
                backgroundColor: '#E2703A',
                flexShrink: 0,
              }}
            />
            L&apos;IA remplit, vous validez
          </span>
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(28px, 4.5vw, 46px)',
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            color: '#221F1D',
            margin: '0 0 14px',
          }}
        >
          Votre projet, en quelques phrases
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 1.55,
            color: '#6B6560',
            margin: '0 0 32px',
          }}
        >
          Une réponse libre suffit — notre IA identifie vos critères d&apos;éligibilité et
          pré-remplit le questionnaire. Vous vérifiez chaque réponse avant de continuer.
        </p>

        {/* White card */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            border: `1.5px solid ${focused ? '#1F5A44' : '#E7E1D9'}`,
            boxShadow: focused
              ? '0 0 0 4px rgba(31,90,68,0.08)'
              : '0 1px 3px rgba(34,31,29,0.06)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <label
            htmlFor="wizard-projet-texte"
            style={{
              position: 'absolute',
              width: 1, height: 1,
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            Description de votre projet
          </label>

          <textarea
            id="wizard-projet-texte"
            ref={textareaRef}
            value={texte}
            onChange={(e) => setTexte(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ex : Je développe une chaîne de boulangeries à Tanger, 3 points de vente prévus, investissement d'environ 1,5 M de dirhams, je veux digitaliser la gestion des caisses et lancer la vente en ligne, et j'embauche 8 personnes."
            disabled={loading}
            aria-describedby={counterId}
            style={{
              width: '100%',
              minHeight: 200,
              resize: 'none',
              border: 'none',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: 18,
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#221F1D',
              backgroundColor: 'transparent',
              padding: '20px 20px 16px',
              boxSizing: 'border-box',
              display: 'block',
              overflow: 'hidden',
            }}
          />

          {/* Card footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px 12px 20px',
              borderTop: '1px solid #F0EBE3',
              gap: 12,
            }}
          >
            <span
              id={counterId}
              aria-live="polite"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: counterColor,
                transition: 'color 0.2s',
                flexShrink: 0,
              }}
            >
              {counterText}
            </span>

            <button
              onClick={() => onAnalyser(texte)}
              disabled={!ok}
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: 15.5,
                color: '#fff',
                backgroundColor: ok ? '#1F5A44' : '#C9BFAE',
                border: 'none',
                borderRadius: 10,
                padding: '9px 20px',
                cursor: ok ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 14, height: 14,
                      border: '2px solid rgba(255,255,255,0.35)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      flexShrink: 0,
                      animation: 'wz-spin 0.7s linear infinite',
                    }}
                  />
                  Analyse…
                </>
              ) : (
                'Analyser mon projet →'
              )}
            </button>
          </div>
        </div>

        {/* Error block */}
        {erreur && (
          <div
            style={{
              backgroundColor: '#FFF7F0',
              border: '1px solid #F3D8C2',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 13.5,
              color: '#8A3520',
              marginBottom: 20,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {erreur}{' '}
            <button
              onClick={onWizardClassique}
              style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', textDecoration: 'underline',
                fontWeight: 500, color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit',
              }}
            >
              Répondre aux questions directement →
            </button>
          </div>
        )}

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              color: '#8A8378',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 420,
            }}
          >
            L&apos;IA ne valide rien à votre place : chaque champ pré-rempli vous est présenté pour relecture à l&apos;étape suivante.
          </p>

          <button
            onClick={onWizardClassique}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 13.5,
              color: '#4A453F',
              backgroundColor: '#fff',
              border: '1px solid #E7E1D9',
              borderRadius: 9,
              padding: '9px 18px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background-color 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#C9BFAE'
              e.currentTarget.style.backgroundColor = '#FAF8F5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E7E1D9'
              e.currentTarget.style.backgroundColor = '#fff'
            }}
          >
            Répondre aux questions une par une
          </button>
        </div>
      </div>

      <style>{`
        @keyframes wz-spin { to { transform: rotate(360deg); } }
        @media (max-width: 639px) {
          #wizard-projet-texte { font-size: 16px !important; }
        }
      `}</style>
    </div>
  )
}
