// Logo Fondouk — 2 variantes : light (fond clair) et dark (fond sombre)
// SVG inline pour garantir le rendu exact indépendamment du chargement des polices

export function LogoFondoukBeta({ height = 32 }: { height?: number }) {
  const w = Math.round(340 * (height / 90))
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" width={w} height={height} aria-label="Fondouk">
      <g>
        <rect width="56" height="56" rx="16" fill="#221F1D"/>
        <rect x="12" y="12" width="18" height="18" rx="3" fill="#E2703A"/>
        <rect x="34" y="12" width="18" height="18" rx="3" fill="#FAF8F5"/>
        <rect x="12" y="34" width="18" height="18" rx="3" fill="#FAF8F5"/>
        <rect x="34" y="34" width="18" height="18" rx="3" fill="#1F5A44"/>
      </g>
      <text x="86" y="52" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="36" letterSpacing="-0.5" fill="#221F1D">Fondouk</text>
      <rect x="264" y="18" width="52" height="22" rx="11" fill="#E2703A"/>
      <text x="290" y="33" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="12" letterSpacing="0.6" fill="#FAF8F5" textAnchor="middle">BETA</text>
    </svg>
  )
}

export function LogoFondoukBetaDark({ height = 32 }: { height?: number }) {
  const w = Math.round(340 * (height / 90))
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" width={w} height={height} aria-label="Fondouk">
      <g>
        <rect width="56" height="56" rx="16" fill="#FAF8F5"/>
        <rect x="12" y="12" width="18" height="18" rx="3" fill="#E2703A"/>
        <rect x="34" y="12" width="18" height="18" rx="3" fill="#221F1D"/>
        <rect x="12" y="34" width="18" height="18" rx="3" fill="#221F1D"/>
        <rect x="34" y="34" width="18" height="18" rx="3" fill="#1F5A44"/>
      </g>
      <text x="86" y="52" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="36" letterSpacing="-0.5" fill="#FAF8F5">Fondouk</text>
      <rect x="264" y="18" width="52" height="22" rx="11" fill="#E2703A"/>
      <text x="290" y="33" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="12" letterSpacing="0.6" fill="#FAF8F5" textAnchor="middle">BETA</text>
    </svg>
  )
}
