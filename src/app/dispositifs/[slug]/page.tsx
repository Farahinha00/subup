import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Dispositif, Critere } from '@/types'
import { LABELS } from '@/lib/labels'

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.moroccan-fondouk.com'

function formatAmount(d: Dispositif): string {
  if (d.taux) return `${d.taux}% pris en charge`
  if (d.montant_max) {
    if (d.montant_max >= 1_000_000)
      return `Jusqu'à ${(d.montant_max / 1_000_000).toFixed(0)} M ${d.devise}`
    return `Jusqu'à ${Math.round(d.montant_max / 1_000)} K ${d.devise}`
  }
  return 'Variable selon dossier'
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function calendarLabel(d: Dispositif): string {
  if (d.guichet_ouvert) return 'Guichet ouvert'
  if (d.prochaine_echeance) return `Échéance ${formatDate(d.prochaine_echeance)}`
  if (d.recurrent_annuel) return 'Appel annuel'
  if (d.recurrent) return 'Récurrent'
  return '—'
}

function natureLabel(d: Dispositif): string {
  return LABELS.type_aide?.[d.type_aide] ?? d.type_aide ?? '—'
}

function mdToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

  const lines = escaped.split('\n')
  const parts: string[] = []
  let listItems: string[] = []
  let paraLines: string[] = []

  function flushList() {
    if (listItems.length === 0) return
    parts.push(`<ul>${listItems.map((l) => `<li>${l}</li>`).join('')}</ul>`)
    listItems = []
  }
  function flushPara() {
    if (paraLines.length === 0) return
    const content = paraLines.join('<br />')
    if (content.trim()) parts.push(`<p>${content}</p>`)
    paraLines = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^[-•*]\s/.test(trimmed)) {
      flushPara()
      listItems.push(trimmed.replace(/^[-•*]\s+/, ''))
    } else if (trimmed === '') {
      flushPara()
      flushList()
    } else {
      flushList()
      paraLines.push(line)
    }
  }
  flushPara()
  flushList()

  return parts.join('')
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: d } = await supabase
    .from('dispositifs')
    .select('nom, type_aide, organisme, montant_max, taux, devise, regles, short_desc')
    .eq('slug', slug)
    .eq('actif', true)
    .single()

  if (!d) return { title: 'Dispositif introuvable' }

  const nature = natureLabel(d as Dispositif)
  const amount = formatAmount(d as Dispositif)
  const critCount = (d.regles as { criteres?: unknown[] })?.criteres?.length ?? 0
  const desc = `${d.short_desc ? d.short_desc + ' ' : ''}${critCount} critères d'éligibilité. ${amount !== 'Variable selon dossier' ? `Montant : ${amount}. ` : ''}Vérifiez votre éligibilité en 3 minutes.`

  return {
    title: `${d.nom} — ${nature} ${d.organisme}`,
    description: desc.trim(),
    alternates: { canonical: `${BASE}/dispositifs/${slug}` },
    openGraph: {
      title: `${d.nom} — ${nature} ${d.organisme}`,
      description: desc.trim(),
      url: `${BASE}/dispositifs/${slug}`,
    },
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function FichePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('dispositifs')
    .select('*')
    .eq('slug', slug)
    .eq('actif', true)
    .single()

  if (!raw) notFound()
  const d = raw as Dispositif

  const nature = natureLabel(d)
  const amount = formatAmount(d)
  const calendar = calendarLabel(d)
  const criteres: Critere[] = Array.isArray(d.regles?.criteres) ? d.regles.criteres : []
  const verifiedAt = d.last_verified_at ?? d.derniere_verification
  const docsCount = d.docs_parcours?.length ?? 0
  const stepsCount = d.depot_steps?.length ?? 0

  const jsonLdService = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: d.nom,
    provider: { '@type': 'Organization', name: d.organisme },
    serviceType: nature,
    areaServed: { '@type': 'Country', name: 'Maroc' },
    url: `${BASE}/dispositifs/${d.slug}`,
    description: d.short_desc ?? undefined,
  }

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Dispositifs', item: `${BASE}/dispositifs` },
      { '@type': 'ListItem', position: 3, name: d.nom, item: `${BASE}/dispositifs/${d.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdService) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <link rel="canonical" href={`${BASE}/dispositifs/${d.slug}`} />

      <article style={{ padding: '42px 32px 54px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 12.5, color: '#8A8378', marginBottom: 28, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link href="/" style={{ color: '#8A8378', textDecoration: 'none' }}>Accueil</Link>
          <span style={{ color: '#C9BFAE' }}>/</span>
          <Link href="/dispositifs" style={{ color: '#8A8378', textDecoration: 'none' }}>Dispositifs</Link>
          <span style={{ color: '#C9BFAE' }}>/</span>
          <span style={{ color: '#4A453F', fontWeight: 600 }}>{d.nom}</span>
        </nav>

        {/* Hero — 2 colonnes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 348px',
          gap: 30,
          alignItems: 'stretch',
          marginBottom: 28,
        }}>

          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill color="vert">{nature}</Pill>
              {d.organisme && <Pill color="neutre">{d.organisme}</Pill>}
            </div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 44,
              lineHeight: 1.05,
              letterSpacing: '-0.028em',
              color: '#221F1D',
              margin: 0,
              textWrap: 'pretty',
            }}>
              {d.nom}
            </h1>
            {d.short_desc && (
              <div
                className="fiche-prose"
                style={{ fontSize: 17.5, lineHeight: 1.6, color: '#4A453F', margin: 0, maxWidth: 640 }}
                dangerouslySetInnerHTML={{ __html: mdToHtml(d.short_desc) }}
              />
            )}
          </div>

          {/* Bloc d'action — visiteur */}
          <div style={{
            background: '#221F1D',
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div>
              <p style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: '#FAF8F5',
                margin: '0 0 8px',
                lineHeight: 1.3,
              }}>
                Ce dispositif est-il pour vous ?
              </p>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#D8D2C8', margin: 0 }}>
                Répondez à quelques questions sur votre entreprise : Fondouk vous dit où vous en êtes sur {d.nom}, critère par critère.
              </p>
            </div>

            <Link
              href={`/diagnostic?dispositif=${d.slug}`}
              style={{
                display: 'block',
                textAlign: 'center',
                background: '#E2703A',
                color: '#FAF8F5',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 10,
                padding: '14px 20px',
                textDecoration: 'none',
              }}
            >
              Vérifier mon éligibilité — 3 min
            </Link>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#8A8378', margin: 0 }}>
              Gratuit, sans engagement
            </p>
          </div>
        </div>

        {/* Chiffres clés */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 10,
          marginBottom: 40,
        }}>
          {[
            { label: 'Prise en charge', value: amount },
            { label: 'Nature', value: nature },
            { label: "Délai d'instruction", value: d.delai_indicatif ?? 'Variable' },
            { label: 'Périmètre', value: 'Maroc' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#F1EEE9', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8A8378', marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: '#221F1D', lineHeight: 1.3 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Corps — 2 colonnes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)',
          gap: 30,
          alignItems: 'start',
        }}>

          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

            {/* Description */}
            {(d.long_desc || d.short_desc) && (
              <section>
                <h2 style={h2Style}>En quoi consiste ce dispositif</h2>
                <div
                  className="fiche-prose"
                  style={{ fontSize: 15.5, lineHeight: 1.7, color: '#4A453F' }}
                  dangerouslySetInnerHTML={{ __html: mdToHtml(d.long_desc ?? d.short_desc ?? '') }}
                />
                {Array.isArray(d.key_facts) && d.key_facts.length > 0 && (
                  <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(d.key_facts as string[]).map((fact, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 10, fontSize: 14.5, color: '#4A453F',
                        lineHeight: 1.55, background: '#F7FAF8', borderRadius: 9, padding: '11px 13px',
                      }}>
                        <span style={{ color: '#1F5A44', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {fact}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Critères */}
            {criteres.length > 0 && (
              <section>
                <h2 style={h2Style}>Critères d&apos;éligibilité</h2>
                <div style={{ border: '1px solid #E7E1D9', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
                  {criteres.map((c, i) => (
                    <div key={c.id ?? i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '15px 18px',
                      borderBottom: i < criteres.length - 1 ? '1px solid #F1EEE9' : 'none',
                    }}>
                      <span style={{
                        flexShrink: 0, width: 7, height: 7, borderRadius: '50%',
                        background: '#1F5A44', marginTop: 7,
                      }} />
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: '#221F1D', lineHeight: 1.5 }}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Encadré orange — info operateur */}
                <div style={{
                  marginTop: 12,
                  background: '#FDF3EC',
                  border: '1px solid #F3D9C7',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  gap: 10,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: '#4A453F',
                }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: '#E2703A', flexShrink: 0 }}>i</span>
                  <span>
                    Ces critères sont ceux publiés par l&apos;opérateur. Savoir si{' '}
                    <strong>votre</strong> entreprise les remplit relève du diagnostic, qui reste dans votre espace.
                  </span>
                </div>
              </section>
            )}

            {/* Encadré signalement */}
            <div style={{
              background: '#F1EEE9',
              border: '1px solid #E7E1D9',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              gap: 12,
              fontSize: 13.5,
              lineHeight: 1.6,
              color: '#4A453F',
            }}>
              <span style={{
                flexShrink: 0, width: 17, height: 17, borderRadius: '50%',
                border: '1.5px solid #8A8378', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#8A8378', marginTop: 2,
              }}>i</span>
              <span>
                Une information inexacte ou obsolète ?{' '}
                <a
                  href={`mailto:corrections@fondouk.ma?subject=${encodeURIComponent(`Correction fiche ${d.nom}`)}`}
                  style={{ color: '#1F5A44', borderBottom: '1px solid rgba(31,90,68,0.35)', textDecoration: 'none' }}
                >
                  Signalez-la à notre équipe
                </a>{' '}
                — nous vérifions sous 48h.
              </span>
            </div>
          </div>

          {/* Colonne droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Informations officielles */}
            <div style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8A8378', marginBottom: 14 }}>
                Informations officielles
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14 }}>
                {[
                  { label: 'Opérateur', value: d.organisme },
                  { label: 'Tutelle', value: d.operateur ?? '—' },
                  { label: "Nature de l'aide", value: nature },
                  { label: 'Périmètre', value: 'Maroc' },
                  { label: 'Cumulable', value: d.soumis_de_minimis ? 'Soumis de minimis' : 'À vérifier' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#8A8378', marginBottom: 4 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#221F1D' }}>{value}</div>
                  </div>
                ))}
              </div>

              {(d.lien_officiel || verifiedAt) && (
                <div style={{
                  marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1EEE9',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                }}>
                  {d.lien_officiel && (
                    <a href={d.lien_officiel} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13.5, fontWeight: 600, color: '#1F5A44', textDecoration: 'none' }}>
                      Source officielle →
                    </a>
                  )}
                  {verifiedAt && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: '#EAF3EE', border: '1px solid #DCE9E2', color: '#1F5A44',
                      borderRadius: 100, padding: '3px 10px',
                    }}>
                      Vérifié le {formatDate(verifiedAt)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Constituer le dossier — Prochainement */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <h2 style={{ ...h2Style, margin: 0 }}>Constituer le dossier</h2>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: '#FDF3EC', border: '1px solid #F3D9C7', color: '#E2703A',
                  borderRadius: 100, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  🔒 Prochainement
                </span>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 14, overflow: 'hidden' }}>
                {/* Volumétrie */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ padding: '20px 22px', borderRight: '1px solid #F1EEE9' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#6B6560', marginBottom: 6 }}>Documents requis</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: '#A8A199', marginBottom: 6 }}>
                      {docsCount > 0 ? `${docsCount} pièces` : '—'}
                    </div>
                    <div style={{ fontSize: 13, color: '#8A8378', lineHeight: 1.5 }}>
                      Checklist complète des pièces à réunir, avec modèles et attestations à jour.
                    </div>
                  </div>
                  <div style={{ padding: '20px 22px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#6B6560', marginBottom: 6 }}>Démarches de dépôt</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: '#A8A199', marginBottom: 6 }}>
                      {stepsCount > 0 ? `${stepsCount} étapes` : '—'}
                    </div>
                    <div style={{ fontSize: 13, color: '#8A8378', lineHeight: 1.5 }}>
                      Procédure détaillée, interlocuteur à chaque étape et délais d&apos;instruction.
                    </div>
                  </div>
                </div>

                {/* Pied visiteur */}
                <div style={{ background: '#FDF3EC', borderTop: '1px solid #F3D9C7', padding: '18px 22px' }}>
                  <p style={{ fontSize: 13.5, color: '#4A453F', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Le détail des pièces et la procédure de dépôt arrivent prochainement, et resteront accessibles uniquement depuis un compte connecté.
                  </p>
                  <Link
                    href="/inscription"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      background: '#221F1D',
                      color: '#FAF8F5',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: 13.5,
                      borderRadius: 9,
                      padding: '12px 20px',
                      textDecoration: 'none',
                    }}
                  >
                    Créer mon compte pour y accéder
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </article>
    </>
  )
}

// ── Composants internes ───────────────────────────────────────────────────────

function Pill({ children, color }: { children: React.ReactNode; color: 'vert' | 'neutre' }) {
  const styles = color === 'vert'
    ? { background: '#EAF3EE', border: '1px solid #DCE9E2', color: '#1F5A44' }
    : { background: '#F1EEE9', border: '1px solid #E7E1D9', color: '#8A8378' }
  return (
    <span style={{
      ...styles,
      fontSize: 12,
      fontWeight: 600,
      borderRadius: 100,
      padding: '4px 12px',
      display: 'inline-flex',
      alignItems: 'center',
      lineHeight: 1.4,
    }}>
      {children}
    </span>
  )
}

const h2Style: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: 22,
  letterSpacing: '-0.015em',
  color: '#221F1D',
  margin: '0 0 16px',
  lineHeight: 1.2,
}
