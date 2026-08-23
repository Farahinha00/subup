// Logo Fondouk — viewBox recadré sur le contenu réel (320×58) pour que
// le rendu à taille fixe remplisse vraiment la hauteur demandée.
// Le viewBox original (340×90) laissait 32px de blanc en bas → logo "microscopique".

const RATIO = 320 / 58  // largeur/hauteur du contenu réel

function IconSquares({ dark }: { dark: boolean }) {
  return (
    <g>
      <rect width="56" height="56" rx="16" fill={dark ? '#FAF8F5' : '#221F1D'}/>
      <rect x="12" y="12" width="18" height="18" rx="3" fill="#E2703A"/>
      <rect x="34" y="12" width="18" height="18" rx="3" fill={dark ? '#221F1D' : '#FAF8F5'}/>
      <rect x="12" y="34" width="18" height="18" rx="3" fill={dark ? '#221F1D' : '#FAF8F5'}/>
      <rect x="34" y="34" width="18" height="18" rx="3" fill="#1F5A44"/>
    </g>
  )
}

function BetaBadge() {
  return (
    <>
      <rect x="264" y="18" width="52" height="22" rx="11" fill="#E2703A"/>
      <text x="290" y="33" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="12" letterSpacing="0.6" fill="#FAF8F5" textAnchor="middle">BETA</text>
    </>
  )
}

export function LogoFondoukBeta({ height = 40 }: { height?: number }) {
  const w = Math.round(height * RATIO)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 58" width={w} height={height} aria-label="Fondouk">
      <IconSquares dark={false} />
      <text x="74" y="48" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="36" letterSpacing="-0.5" fill="#221F1D">Fondouk</text>
      <BetaBadge />
    </svg>
  )
}

export function LogoFondoukBetaDark({ height = 40 }: { height?: number }) {
  const w = Math.round(height * RATIO)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 58" width={w} height={height} aria-label="Fondouk">
      <IconSquares dark={true} />
      <text x="74" y="48" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="36" letterSpacing="-0.5" fill="#FAF8F5">Fondouk</text>
      <BetaBadge />
    </svg>
  )
}
