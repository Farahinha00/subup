import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LABELS } from '@/lib/labels'
import type { Dispositif } from '@/types'
import CatalogueCta from './CatalogueCta'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.moroccan-fondouk.com'

export const metadata: Metadata = {
  title: 'Dispositifs d\'aide publique aux entreprises au Maroc',
  description: 'Subventions, primes, prêts bonifiés, garanties et programmes d\'accompagnement. Chaque fiche détaille le montant, la nature de l\'aide et les critères d\'éligibilité — en consultation libre, sans création de compte.',
  alternates: { canonical: `${BASE}/dispositifs` },
  robots: { index: true, follow: true },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMontant(d: Pick<Dispositif, 'montant_max' | 'taux' | 'devise'>): string {
  if (d.montant_max) {
    if (d.montant_max >= 1_000_000) return `${(d.montant_max / 1_000_000).toFixed(0)} M ${d.devise}`
    if (d.montant_max >= 1_000) return `${Math.round(d.montant_max / 1_000)} K ${d.devise}`
    return `${d.montant_max} ${d.devise}`
  }
  if (d.taux) return `${d.taux}% du projet`
  return '—'
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  } catch { return null }
}

// ── Facette chips data ───────────────────────────────────────────────────────

const TYPE_CHIPS = [
  { label: 'Subvention', slug: 'subvention' },
  { label: 'Prime', slug: 'prime' },
  { label: 'Prêt bonifié', slug: 'pret' },
  { label: 'Garantie', slug: 'garantie' },
  { label: 'Accompagnement', slug: 'accompagnement' },
  { label: 'Aide à l\'embauche', slug: 'emploi' },
]

const OPERATEUR_CHIPS = [
  { label: 'Maroc PME', slug: 'maroc-pme' },
  { label: 'Tamwilcom', slug: 'tamwilcom' },
  { label: 'ANAPEC', slug: 'anapec' },
  { label: 'CRI', slug: 'cri' },
  { label: 'SMIT', slug: 'smit' },
  { label: 'Ministère de l\'Industrie', slug: 'ministere-industrie' },
]

// ── Card ─────────────────────────────────────────────────────────────────────

function DispoCard({ d }: { d: Dispositif }) {
  const typeLabel = LABELS.type_aide?.[d.type_aide] ?? d.type_aide
  const montant = formatMontant(d)

  return (
    <Link
      href={`/dispositifs/${d.slug}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        background: '#FFFFFF',
        border: '1px solid #E7E1D9',
        borderRadius: 14,
        padding: 20,
        textDecoration: 'none',
        transition: 'border-color 0.15s',
        minHeight: 0,
      }}
      className="dispo-card"
    >
      {/* Top row: pill + montant */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-block',
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#1F5A44',
          background: '#EAF3EE',
          border: '1px solid #DCE9E2',
          borderRadius: 100,
          padding: '4px 10px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {typeLabel}
        </span>
        {montant !== '—' && (
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: '#4A453F',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {montant}
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: 17.5,
        color: '#221F1D',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      }}>
        {d.nom}
      </div>

      {/* Short desc */}
      {d.short_desc && (
        <div style={{
          fontSize: 13.5,
          lineHeight: 1.5,
          color: '#6B6560',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {d.short_desc}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 12,
        borderTop: '1px solid #F1EEE9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 12.5, color: '#8A8378', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.organisme}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11.5,
          color: '#C9BFAE',
          flexShrink: 0,
        }}>
          {d.slug}
        </span>
      </div>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DispositifsPage() {
  const supabase = await createClient()

  const { data: dispositifs } = await supabase
    .from('dispositifs')
    .select('id, slug, nom, organisme, type_aide, montant_max, taux, devise, short_desc, last_verified_at, derniere_verification, actif')
    .eq('actif', true)
    .eq('pays', 'MA')
    .order('nom', { ascending: true })

  const list = (dispositifs ?? []) as Dispositif[]

  // Last verified date — most recent across all dispositifs
  const lastVerifiedRaw = list.reduce<string | null>((best, d) => {
    const v = d.last_verified_at ?? d.derniere_verification ?? null
    if (!v) return best
    if (!best) return v
    return v > best ? v : best
  }, null)
  const lastVerifiedLabel = formatDate(lastVerifiedRaw)

  return (
    <>
      <style>{`
        .dispo-card:hover { border-color: #1F5A44 !important; }
        .facette-chip:hover { border-color: #1F5A44 !important; color: #1F5A44 !important; }
        .facette-chip-op:hover { border-color: #1F5A44 !important; color: #1F5A44 !important; }
      `}</style>

      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '42px 32px 54px' }}>

        {/* Fil d'Ariane */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#8A8378', marginBottom: 32 }}>
          <Link href="/" style={{ color: '#8A8378', textDecoration: 'none' }}>Accueil</Link>
          <span style={{ color: '#C9BFAE' }}>/</span>
          <span style={{ color: '#4A453F', fontWeight: 600 }}>Dispositifs</span>
        </div>

        {/* En-tête */}
        <div style={{ maxWidth: 780, marginBottom: 34 }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 38,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#221F1D',
            marginBottom: 14,
            textWrap: 'pretty',
          } as React.CSSProperties}>
            Les dispositifs d&apos;aide publique aux entreprises au Maroc
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: '#4A453F', margin: 0, textWrap: 'pretty' } as React.CSSProperties}>
            Subventions, primes, prêts bonifiés, garanties et programmes d&apos;accompagnement.
            Chaque fiche détaille le montant, la nature de l&apos;aide et les critères d&apos;éligibilité
            publiés par l&apos;opérateur — en consultation libre, sans création de compte.
          </p>
        </div>

        {/* Facettes */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Par nature */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TYPE_CHIPS.map((c) => (
              <Link
                key={c.slug}
                href={`/dispositifs/type/${c.slug}`}
                className="facette-chip"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#4A453F',
                  background: '#F1EEE9',
                  border: '1px solid #E7E1D9',
                  borderRadius: 100,
                  padding: '7px 14px',
                  textDecoration: 'none',
                  transition: 'border-color 0.12s, color 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </Link>
            ))}
          </div>
          {/* Par opérateur */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {OPERATEUR_CHIPS.map((c) => (
              <Link
                key={c.slug}
                href={`/dispositifs/operateur/${c.slug}`}
                className="facette-chip-op"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#6B6560',
                  background: '#FAF8F5',
                  border: '1px solid #E7E1D9',
                  borderRadius: 100,
                  padding: '7px 14px',
                  textDecoration: 'none',
                  transition: 'border-color 0.12s, color 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Ligne de comptage */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: '#221F1D',
          }}>
            {list.length} dispositif{list.length !== 1 ? 's' : ''} référencé{list.length !== 1 ? 's' : ''}
          </span>
          {lastVerifiedLabel && (
            <span style={{ fontSize: 13, color: '#8A8378' }}>
              Données vérifiées en {lastVerifiedLabel}
            </span>
          )}
        </div>

        {/* Grille de cartes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: 14,
        }}>
          {list.map((d) => (
            <DispoCard key={d.id} d={d} />
          ))}
          {list.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#8A8378', fontSize: 15 }}>
              Aucun dispositif disponible pour le moment.
            </div>
          )}
        </div>

        {/* CTA bannière (client island — visitor par défaut) */}
        <CatalogueCta />

      </div>
    </>
  )
}
