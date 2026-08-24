'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Dispositif, Critere } from '@/types'
import { LABELS } from '@/lib/labels'

// ── helpers ────────────────────────────────────────────────────────────────

function formatMontant(d: Dispositif) {
  if (d.montant_max) {
    if (d.montant_max >= 1_000_000)
      return `${(d.montant_max / 1_000_000).toFixed(0)} M ${d.devise}`
    return `${Math.round(d.montant_max / 1_000)} K ${d.devise}`
  }
  if (d.taux) return `${d.taux}% du projet`
  return '—'
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// ── RichText — préserve titres de section et sauts de ligne du CSV ─────────
// Règle de détection titre : ligne courte, sans ponctuation finale, commence
// par une majuscule ou une lettre accentuée majuscule.
function isSectionTitle(line: string): boolean {
  const t = line.trim()
  if (!t || t.length > 80) return false
  if (/[.,;:]$/.test(t)) return false           // se termine par ponctuation → contenu
  if (/^[-•*]/.test(t)) return false            // bullet → contenu
  if (/^\d+[).]\s/.test(t)) return false        // "1) ..." → contenu numéroté
  if (/^[a-zàâäéèêëîïôöùûüç]/.test(t)) return false  // minuscule → contenu
  return true
}

// Découpe une ligne en segments texte/gras pour rendre **...**
function parseInline(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[\s\S]*?\*\*)/)
  if (parts.length === 1) return line
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2)
      return <strong key={i} style={{ fontWeight: 700, color: '#221F1D' }}>{inner}</strong>
    }
    return part
  })
}

// Ligne complète en gras = titre de section (ex : **Montant et Durée**)
function isFullBold(line: string): boolean {
  const t = line.trim()
  return t.startsWith('**') && t.endsWith('**') && !t.slice(2, -2).includes('**')
}

function RichText({ text, baseStyle }: { text: string; baseStyle?: React.CSSProperties }) {
  const lines = text.split('\n')
  // regrouper en blocs séparés par lignes vides
  const blocks: string[][] = []
  let cur: string[] = []
  for (const l of lines) {
    if (l.trim() === '') {
      if (cur.length) { blocks.push(cur); cur = [] }
    } else {
      cur.push(l)
    }
  }
  if (cur.length) blocks.push(cur)

  return (
    <div style={{ fontSize: 14, color: '#4A453F', lineHeight: 1.75, ...baseStyle }}>
      {blocks.map((block, bi) => {
        const firstLine = block[0].trim()
        // Titre : soit ligne sans ponctuation (structure CSV), soit ligne entièrement en **gras**
        const isTitle = isSectionTitle(firstLine.replace(/\*\*/g, '')) || isFullBold(firstLine)
        const titleText = firstLine.replace(/\*\*/g, '')
        const rest = isTitle ? block.slice(1) : block

        return (
          <div key={bi} style={{ marginBottom: bi < blocks.length - 1 ? 14 : 0 }}>
            {isTitle && (
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700, fontSize: 13.5,
                color: '#221F1D', marginBottom: 6, marginTop: bi > 0 ? 4 : 0,
              }}>
                {titleText}
              </div>
            )}
            {(isTitle ? rest : block).map((line, li) => (
              <div key={li} style={{ lineHeight: 1.7 }}>{parseInline(line.trim())}</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── style tokens ───────────────────────────────────────────────────────────

const BADGE_PROCHAINEMENT: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: '#fff',
  border: '1px solid #E7E1D9',
  borderRadius: 100,
  padding: '3px 8px',
  color: '#8A8378',
  flexShrink: 0,
}

// ── FicheComplete ──────────────────────────────────────────────────────────

function FicheComplete({ d }: { d: Dispositif }) {
  const montant = formatMontant(d)
  const typeLabel = LABELS.type_aide?.[d.type_aide] ?? d.type_aide
  const categorieLabel = d.categorie
    ? LABELS.categorie_dispositif?.[d.categorie] ?? d.categorie
    : '—'
  const criteres: Critere[] = Array.isArray(d.regles?.criteres) ? d.regles.criteres : []
  const keyFacts: string[] = Array.isArray(d.key_facts) ? d.key_facts : []
  const verifiedAt = formatDate(d.last_verified_at ?? d.derniere_verification)

  return (
    <div style={{ padding: '0 4px' }}>

      {/* 1. Bandeau opérateur */}
      <div style={{
        background: '#EAF3EE', border: '1px solid #DCE9E2', borderRadius: 12,
        padding: '14px 18px', marginBottom: 20,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#4A453F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Opéré par
        </span>
        {' '}
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1F5A44' }}>
          {d.organisme}
        </span>
      </div>

      {/* 2. 4 tuiles sable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Montant', value: montant },
          { label: 'Nature', value: typeLabel },
          { label: 'Délai', value: d.delai_indicatif ?? 'Variable' },
          { label: 'Catégorie', value: categorieLabel },
        ].map((t) => (
          <div key={t.label} style={{ background: '#F1EEE9', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#8A8378', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
              {t.label}
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1.3, color: '#221F1D' }}>
              {t.value}
            </div>
          </div>
        ))}
      </div>

      {/* 3. En quoi ça consiste */}
      {d.long_desc && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4A453F', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            En quoi ça consiste
          </div>
          <RichText text={d.long_desc} />
        </div>
      )}

      {/* 4. Deux colonnes : Ce que couvre + Critères */}
      {(keyFacts.length > 0 || criteres.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* Ce que couvre le dispositif */}
          {keyFacts.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4A453F', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                Ce que couvre le dispositif
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {keyFacts.map((fact, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: '#4A453F', lineHeight: 1.5 }}>
                    <span style={{ color: '#1F5A44', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ background: '#F7FAF8', borderRadius: 6, padding: '3px 8px', flex: 1 }}>{fact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critères d'éligibilité */}
          {criteres.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4A453F', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                Critères d&apos;éligibilité
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {criteres.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '6px 10px', border: '1px solid #E7E1D9', borderRadius: 8 }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 6, flexShrink: 0, marginTop: 1,
                      background: c.bloquant ? '#FFF6EF' : '#F1EEE9',
                      color: c.bloquant ? '#B8552A' : '#8A8378',
                    }}>
                      {c.bloquant ? 'Bloquant' : 'Critère'}
                    </span>
                    <span style={{ fontSize: 13, color: '#4A453F', lineHeight: 1.5 }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Bandeau Prochainement (pièces + étapes) */}
      <div style={{
        border: '1.5px dashed #C9BFAE', borderRadius: 12, padding: '14px 18px',
        marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13.5, color: '#8A8378', fontStyle: 'italic' }}>
          Les pièces à fournir et les étapes de dépôt détaillées arrivent avec le montage de dossier accompagné.
        </span>
        <span style={BADGE_PROCHAINEMENT}>PROCHAINEMENT</span>
      </div>

      {/* 6. Pied de fiche */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {d.lien_officiel ? (
          <a
            href={d.lien_officiel}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13.5, fontWeight: 600, color: '#E2703A', textDecoration: 'none' }}
          >
            Lien officiel →
          </a>
        ) : <span />}
        {verifiedAt && (
          <span style={{ fontSize: 12, color: '#8A8378' }}>
            Informations vérifiées le {verifiedAt}
          </span>
        )}
      </div>
    </div>
  )
}

// ── AccordionRow ───────────────────────────────────────────────────────────

function AccordionRow({
  d,
  open,
  onToggle,
}: {
  d: Dispositif
  open: boolean
  onToggle: () => void
}) {
  const montant = formatMontant(d)
  const criteres: Critere[] = Array.isArray(d.regles?.criteres) ? d.regles.criteres : []
  const categorieLabel = d.categorie
    ? LABELS.categorie_dispositif?.[d.categorie] ?? d.categorie
    : '—'
  const typeLabel = LABELS.type_aide?.[d.type_aide] ?? d.type_aide

  return (
    <div
      style={{
        border: '1px solid #E7E1D9', borderRadius: 18, background: '#fff',
        overflow: 'hidden',
        boxShadow: open ? '0 2px 12px rgba(31,90,68,0.06)' : 'none',
      }}
    >
      {/* Summary row */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 16,
          padding: '20px 24px', cursor: 'pointer', background: 'none', border: 'none',
          textAlign: 'left',
        }}
      >
        {/* Left: nom + tags + opérateur */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 15, lineHeight: 1.35, color: '#221F1D', marginBottom: 8,
          }}>
            {d.nom}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Catégorie — violine */}
            <span style={{ background: '#EFEAF7', color: '#5A4A78', fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 100 }}>
              {categorieLabel}
            </span>
            {/* Nature — sable */}
            <span style={{ background: '#F1EEE9', color: '#6B6560', fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 100 }}>
              {typeLabel}
            </span>
            <span style={{ fontSize: 12, color: '#8A8378' }}>{d.organisme}</span>
          </div>
        </div>

        {/* Right: montant + nb critères */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#221F1D' }}>
            {montant}
          </div>
          <div style={{ fontSize: 11.5, color: '#8A8378', marginTop: 3 }}>
            {criteres.length} critère{criteres.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Chevron */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          style={{
            flexShrink: 0, color: '#8A8378',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Fiche dépliée */}
      {open && (
        <div style={{ borderTop: '1px solid #E7E1D9', padding: '24px 28px 28px' }}>
          <FicheComplete d={d} />
        </div>
      )}
    </div>
  )
}

// ── CatalogueContent ───────────────────────────────────────────────────────

function CatalogueContent({ dispositifs }: { dispositifs: Dispositif[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const aideParam = searchParams.get('aide')

  const [filtre, setFiltre] = useState<string>('tous')
  const [ouvert, setOuvert] = useState<string | null>(aideParam)

  // Ouvrir la fiche ciblée par l'URL au premier rendu
  useEffect(() => {
    if (aideParam) setOuvert(aideParam)
  }, [aideParam])

  // Catégories présentes dans les données
  const categoriesPresentes = [
    ...new Set(dispositifs.map((d) => d.categorie).filter(Boolean) as string[]),
  ]

  const filtres = [
    { key: 'tous', label: 'Tous' },
    ...categoriesPresentes.map((cat) => ({
      key: cat,
      label: LABELS.categorie_dispositif?.[cat] ?? cat,
    })),
  ]

  const liste = filtre === 'tous'
    ? dispositifs
    : dispositifs.filter((d) => d.categorie === filtre)

  function handleToggle(d: Dispositif) {
    const slug = d.slug ?? d.id
    const nextOuvert = ouvert === slug ? null : slug
    setOuvert(nextOuvert)
    const url = new URL(window.location.href)
    if (nextOuvert) {
      url.searchParams.set('aide', nextOuvert)
    } else {
      url.searchParams.delete('aide')
    }
    router.replace(url.pathname + (url.search || ''), { scroll: false })
  }

  return (
    <>
      {/* ── En-tête ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13,
            color: '#E2703A', background: '#FFF6EF', border: '1px solid #F3D8C2',
            borderRadius: 8, padding: '3px 9px',
          }}>
            MA
          </span>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, margin: 0, color: '#221F1D' }}>
            Catalogue des dispositifs
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 13.5, color: '#8A8378' }}>
            {liste.length} dispositif{liste.length !== 1 ? 's' : ''} actif{liste.length !== 1 ? 's' : ''} · consultation libre
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#1F5A44', background: '#EAF3EE',
            border: '1px solid #DCE9E2', borderRadius: 100, padding: '3px 10px', letterSpacing: '0.02em',
          }}>
            Accès gratuit
          </span>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {filtres.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            style={{
              padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
              borderColor: filtre === f.key ? '#1F5A44' : '#E7E1D9',
              background: filtre === f.key ? '#1F5A44' : '#fff',
              color: filtre === f.key ? '#fff' : '#6B6560',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Liste accordéon ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48 }}>
        {liste.map((d) => (
          <AccordionRow
            key={d.id}
            d={d}
            open={ouvert === (d.slug ?? d.id)}
            onToggle={() => handleToggle(d)}
          />
        ))}
        {liste.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8A8378', fontSize: 14 }}>
            Aucun dispositif dans cette catégorie.
          </div>
        )}
      </div>

      {/* ── Encart bas de page ── */}
      <div style={{ border: '1.5px dashed #C9BFAE', borderRadius: 18, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            Lesquels vous concernent vraiment ?
          </div>
          <p style={{ fontSize: 13.5, color: '#6B6560', margin: 0 }}>
            Répondez à 5 questions sur votre entreprise et obtenez la liste personnalisée des dispositifs auxquels vous êtes éligible.
          </p>
        </div>
        <a
          href="/tableau-de-bord"
          style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
            background: '#1F5A44', color: '#FAF8F5', borderRadius: 10,
            padding: '12px 22px', textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          Voir mes résultats
        </a>
      </div>
    </>
  )
}

// ── export ─────────────────────────────────────────────────────────────────

export default function CatalogueClient({ dispositifs }: { dispositifs: Dispositif[] }) {
  return (
    <Suspense>
      <CatalogueContent dispositifs={dispositifs} />
    </Suspense>
  )
}
