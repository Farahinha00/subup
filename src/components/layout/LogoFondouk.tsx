export type LogoSize = 'nav' | 'footer' | 'hero'
export type LogoVariant = 'default' | 'beta' | 'onDark'

const SIZES: Record<LogoSize, { icon: number; text: number; gap: number }> = {
  nav:    { icon: 32, text: 23, gap: 9 },
  footer: { icon: 26, text: 19, gap: 8 },
  hero:   { icon: 48, text: 35, gap: 14 },
}

function LogoIcon({ size, dark }: { size: number; dark: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden>
      <rect width="56" height="56" rx="16" fill={dark ? '#FAF8F5' : '#221F1D'} />
      <rect x="12" y="12" width="18" height="18" rx="3" fill="#E2703A" />
      <rect x="34" y="12" width="18" height="18" rx="3" fill={dark ? '#221F1D' : '#FAF8F5'} />
      <rect x="12" y="34" width="18" height="18" rx="3" fill={dark ? '#221F1D' : '#FAF8F5'} />
      <rect x="34" y="34" width="18" height="18" rx="3" fill="#1F5A44" />
    </svg>
  )
}

export function Logo({
  size = 'nav',
  variant = 'default',
}: {
  size?: LogoSize
  variant?: LogoVariant
}) {
  const { icon, text, gap } = SIZES[size]
  const dark = variant === 'onDark'
  const textColor = dark ? '#FAF8F5' : '#221F1D'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap }} aria-label="Fondouk">
      <LogoIcon size={icon} dark={dark} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: text,
            lineHeight: 1,
            letterSpacing: '-0.025em',
            color: textColor,
          }}
        >
          Fondouk
        </span>
        {variant === 'beta' && (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: '#E2703A',
              borderRadius: 100,
              padding: '2px 6px',
              color: '#FAF8F5',
              lineHeight: 1.5,
              marginTop: 1,
            }}
          >
            Bêta
          </span>
        )}
      </div>
    </div>
  )
}

// Legacy exports — conservés pour compatibilité
export function LogoFondoukBeta({ height: _h }: { height?: number } = {}) {
  return <Logo size="nav" variant="beta" />
}

export function LogoFondoukBetaDark({ height: _h }: { height?: number } = {}) {
  return <Logo size="nav" variant="onDark" />
}
