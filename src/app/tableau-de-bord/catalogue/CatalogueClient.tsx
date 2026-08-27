'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Dispositif, Critere } from '@/types'
import { LABELS } from '@/lib/labels'
import { createClient } from '@/lib/supabase/client'

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── RichText ─────────────────────────────────────────────────────────────────

function isSectionTitle(line: string): boolean {
  const t = line.trim()
  if (!t || t.length > 80) return false
  if (/[.,;:]$/.test(t)) return false
  if (/^[-•*]/.test(t)) return false
  if (/^\d+[).]\s/.test(t)) return false
  if (/^[a-zàâäéèêëîïôöùûüç]/.test(t)) return false
  return true
}

function parseInline(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[\s\S]*?\*\*)/)
  if (parts.length === 1) return line
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: '#221F1D' }}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function isFullBold(line: string): boolean {
  const t = line.trim()
  return t.startsWith('**') && t.endsWith('**') && !t.slice(2, -2).includes('**')
}

function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
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
    <div style={{ fontSize: 14, color: '#4A453F', lineHeight: 1.75 }}>
      {blocks.map((block, bi) => {
        const firstLine = block[0].trim()
        const isTitle = isSectionTitle(firstLine.replace(/\*\*/g, '')) || isFullBold(firstLine)
        const titleText = firstLine.replace(/\*\*/g, '')
        return (
          <div key={bi} style={{ marginBottom: bi < blocks.length - 1 ? 14 : 0 }}>
            {isTitle && (
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13.5, color: '#221F1D', marginBottom: 6, marginTop: bi > 0 ? 4 : 0 }}>
                {titleText}
              </div>
            )}
            {(isTitle ? block.slice(1) : block).map((line, li) => (
              <div key={li} style={{ lineHeight: 1.7 }}>{parseInline(line.trim())}</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── Criteria merge ────────────────────────────────────────────────────────────

const LOWER_OPS = ['≥', '>']
const UPPER_OPS = ['≤', '<']
const RANGE_RE = /^(.+?)\s*(≥|≤|>|<)\s*(.+?)(\s*\(.+\))?\s*$/

interface ParsedC { subject: string; op: string; valueStr: string; note: string; original: Critere }

function parseC(c: Critere): ParsedC | null {
  const m = c.label.match(RANGE_RE)
  if (!m) return null
  return { subject: m[1].trim(), op: m[2], valueStr: m[3].trim(), note: m[4] ? m[4].replace(/^\s*\(|\)\s*$/g, '').trim() : '', original: c }
}

type MergedCritere = { kind: 'original'; c: Critere } | { kind: 'merged'; label: string; note: string; bloquant: boolean }

function mergeCriteria(criteres: Critere[]): MergedCritere[] {
  const parsed: Array<{ p: ParsedC; used: boolean }> = []
  const unparsed: Critere[] = []
  for (const c of criteres) {
    const p = parseC(c)
    if (p) parsed.push({ p, used: false })
    else unparsed.push(c)
  }
  const result: MergedCritere[] = []
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].used) continue
    const a = parsed[i].p
    const aIsLower = LOWER_OPS.includes(a.op)
    const aIsUpper = UPPER_OPS.includes(a.op)
    let partner = -1
    for (let j = i + 1; j < parsed.length; j++) {
      if (parsed[j].used) continue
      const b = parsed[j].p
      if (b.subject !== a.subject) continue
      if ((aIsLower && UPPER_OPS.includes(b.op)) || (aIsUpper && LOWER_OPS.includes(b.op))) { partner = j; break }
    }
    if (partner >= 0) {
      parsed[i].used = true
      parsed[partner].used = true
      const b = parsed[partner].p
      const lo = aIsLower ? a : b
      const hi = aIsLower ? b : a
      const flipOp = (op: string) => op === '≥' ? '≤' : op === '>' ? '<' : op === '≤' ? '≥' : '>'
      const label = `${lo.valueStr} ${flipOp(lo.op)} ${a.subject} ${hi.op} ${hi.valueStr}`
      const notes = [lo.note, hi.note].filter(Boolean)
      result.push({ kind: 'merged', label, note: notes.join(' · '), bloquant: a.original.bloquant || b.original.bloquant })
    } else {
      result.push({ kind: 'original', c: a.original })
    }
  }
  for (const c of unparsed) result.push({ kind: 'original', c })
  return result
}

// ── Detail panel tabs ─────────────────────────────────────────────────────────

function TabDesc({ d }: { d: Dispositif }) {
  const montant = formatMontant(d)
  const typeLabel = LABELS.type_aide?.[d.type_aide] ?? d.type_aide
  const keyFacts: string[] = Array.isArray(d.key_facts) ? d.key_facts : []

  return (
    <div>
      {/* Intitulé officiel complet */}
      {d.short_desc && (
        <div style={{ fontSize: 14.5, color: '#4A453F', lineHeight: 1.55, marginBottom: 14 }}>
          {d.short_desc}
        </div>
      )}

      {/* Bandeau opérateur */}
      <div style={{ display: 'flex', gap: 9, fontSize: 13.5, lineHeight: 1.5, background: '#F7FAF8', border: '1px solid #DCE9E2', borderRadius: 10, padding: '11px 13px', marginBottom: 18 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A8378', flexShrink: 0, paddingTop: 2 }}>Opéré par</span>
        <span style={{ color: '#1F5A44', fontWeight: 600 }}>{d.organisme}</span>
      </div>

      {/* 3 tuiles sable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Montant', value: montant },
          { label: 'Nature', value: typeLabel },
          { label: 'Délai', value: d.delai_indicatif ?? 'Variable' },
        ].map((t) => (
          <div key={t.label} style={{ background: '#F1EEE9', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A8378', marginBottom: 5 }}>{t.label}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14.5, lineHeight: 1.3 }}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Description longue */}
      {d.long_desc && (
        <div style={{ marginBottom: 24 }}>
          <RichText text={d.long_desc} />
        </div>
      )}

      {/* Ce que couvre le dispositif */}
      {keyFacts.length > 0 && (
        <>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1F5A44', marginBottom: 12 }}>Ce que couvre le dispositif</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {keyFacts.map((k, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: '#4A453F', lineHeight: 1.55, background: '#F7FAF8', borderRadius: 9, padding: '11px 13px' }}>
                <span style={{ color: '#1F5A44', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {k}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TabCriteria({ d }: { d: Dispositif }) {
  const criteres: Critere[] = Array.isArray(d.regles?.criteres) ? d.regles.criteres : []
  const merged = mergeCriteria(criteres)

  return (
    <div>
      <div style={{ fontSize: 14, color: '#6B6560', lineHeight: 1.6, marginBottom: 18, maxWidth: 620 }}>
        Les {criteres.length} conditions à remplir pour que le dossier soit recevable. Le diagnostic vous dit lesquelles votre entreprise remplit déjà.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {merged.map((item, idx) => {
          const label = item.kind === 'original' ? item.c.label : item.label
          const note = item.kind === 'merged' ? item.note : ''
          const key = item.kind === 'original' ? item.c.id : `merged-${idx}`
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 14, color: '#221F1D', lineHeight: 1.5, border: '1px solid #E7E1D9', borderRadius: 10, padding: '12px 14px' }}>
              <span style={{ color: '#C9BFAE', flexShrink: 0 }}>—</span>
              <span>
                {label}
                {note && <span style={{ fontSize: 12, color: '#8A8378', marginLeft: 6 }}>({note})</span>}
              </span>
            </div>
          )
        })}
        {merged.length === 0 && (
          <div style={{ fontSize: 14, color: '#8A8378', fontStyle: 'italic' }}>Aucun critère spécifié pour ce dispositif.</div>
        )}
      </div>
    </div>
  )
}

function TabDossier({ d }: { d: Dispositif }) {
  const [waitlistSent, setWaitlistSent] = useState(false)
  const [waitlistLoading, setWaitlistLoading] = useState(false)

  const docsCount = d.docs_parcours?.length ?? 0
  const stepsCount = d.depot_steps?.length ?? 0

  async function handleWaitlist() {
    setWaitlistLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        await supabase.from('waitlist_entries').insert({
          email: user.email,
          source: 'catalogue_dossier',
          aid_id: d.id,
        })
      }
      setWaitlistSent(true)
    } catch {
      setWaitlistSent(true)
    } finally {
      setWaitlistLoading(false)
    }
  }

  return (
    <div>
      {/* 2 tuiles de comptage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#F1EEE9', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, lineHeight: 1 }}>{docsCount}</div>
          <div style={{ fontSize: 13.5, color: '#6B6560', marginTop: 7 }}>pièces à fournir</div>
        </div>
        <div style={{ background: '#F1EEE9', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, lineHeight: 1 }}>{stepsCount}</div>
          <div style={{ fontSize: 13.5, color: '#6B6560', marginTop: 7 }}>étapes de dépôt</div>
        </div>
      </div>

      {/* Encart Prochainement */}
      <div style={{ border: '1px dashed #C9BFAE', borderRadius: 12, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>Le détail arrive avec le montage de dossier</div>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8A8378', background: '#F1EEE9', border: '1px solid #E7E1D9', padding: '4px 10px', borderRadius: 100 }}>Prochainement</span>
        </div>
        <div style={{ fontSize: 14, color: '#6B6560', lineHeight: 1.6, marginBottom: 18, maxWidth: 560 }}>
          La liste nominative des pièces, les modèles pré-remplis à télécharger et les étapes de dépôt commentées font partie du montage de dossier.
        </div>

        {waitlistSent ? (
          <div style={{ fontSize: 14, color: '#1F5A44', fontWeight: 600 }}>✓ Vous serez prévenu au lancement. Merci !</div>
        ) : (
          <button
            onClick={handleWaitlist}
            disabled={waitlistLoading}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5, color: '#1F5A44', border: '1px solid #DCE9E2', background: '#F7FAF8', borderRadius: 10, padding: '11px 18px', cursor: 'pointer' }}
          >
            {waitlistLoading ? 'Envoi...' : 'Être prévenu au lancement'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ d }: { d: Dispositif }) {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportDraft, setReportDraft] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)

  const typeLabel = LABELS.type_aide?.[d.type_aide] ?? d.type_aide
  const categorieLabel = d.categorie ? LABELS.categorie_dispositif?.[d.categorie] ?? d.categorie : '—'
  const criteres: Critere[] = Array.isArray(d.regles?.criteres) ? d.regles.criteres : []
  const verifiedAt = formatDate(d.last_verified_at ?? d.derniere_verification)

  async function handleReport(e: React.FormEvent) {
    e.preventDefault()
    if (!reportDraft.trim()) return
    setReportLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('aid_reports').insert({
        aid_id: d.id,
        user_id: user?.id ?? null,
        text: reportDraft.trim(),
        status: 'nouveau',
      })
      setReportSent(true)
      setReportOpen(false)
    } catch {
      setReportSent(true)
      setReportOpen(false)
    } finally {
      setReportLoading(false)
    }
  }

  const tabs: { label: React.ReactNode; badge?: number }[] = [
    { label: 'À quoi ça consiste' },
    { label: 'Critères d\'éligibilité', badge: criteres.length },
    { label: '🔒 Dossier' },
  ]

  return (
    <div style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* a) En-tête fixe */}
      <div style={{ padding: '18px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 11 }}>
          <span style={{ background: '#EFEAF7', color: '#5A4A78', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>{categorieLabel}</span>
          <span style={{ background: '#F1EEE9', color: '#6B6560', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>{typeLabel}</span>
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: '-0.015em', lineHeight: 1.25, margin: '0 0 6px' }}>{d.nom}</h2>
        <div style={{ fontSize: 13.5, color: '#8A8378', lineHeight: 1.4, paddingBottom: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.short_desc ?? d.organisme}
        </div>
      </div>

      {/* b) Barre d'onglets */}
      <div style={{ display: 'flex', gap: 16, padding: '0 28px', borderBottom: '1px solid #E7E1D9', flexShrink: 0, overflow: 'hidden' }}>
        {tabs.map((tab, i) => {
          const isActive = activeTab === i
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i as 0 | 1 | 2)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 700,
                color: isActive ? '#221F1D' : '#8A8378',
                padding: '13px 0',
                borderBottom: `2px solid ${isActive ? '#1F5A44' : 'transparent'}`,
                marginBottom: -1,
                background: 'none', border: 'none',
                borderBottomStyle: 'solid',
                borderBottomWidth: 2,
                borderBottomColor: isActive ? '#1F5A44' : 'transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8A8378', background: '#F1EEE9', padding: '2px 7px', borderRadius: 100 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* c) Zone de contenu */}
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 240, padding: '20px 28px 24px' }}>
        {activeTab === 0 && <TabDesc d={d} />}
        {activeTab === 1 && <TabCriteria d={d} />}
        {activeTab === 2 && <TabDossier d={d} />}
      </div>

      {/* Bandeau signalement (au-dessus du pied) */}
      {reportOpen && (
        <div style={{ borderTop: '1px solid #DCE9E2', background: '#F7FAF8', padding: '16px 28px', flexShrink: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Une information vous semble fausse ou incomplète ?</div>
          <div style={{ fontSize: 12.5, color: '#6B6560', marginBottom: 11 }}>Dites-nous laquelle : on recroise avec la source officielle et on corrige la fiche pour tout le monde.</div>
          <form onSubmit={handleReport} style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <input
              value={reportDraft}
              onChange={(e) => setReportDraft(e.target.value)}
              placeholder="Ex. : le plafond du crédit a changé depuis juin"
              style={{ flex: 1, minWidth: 240, fontFamily: "'Inter', sans-serif", fontSize: 13.5, border: '1px solid #C9BFAE', borderRadius: 9, padding: '10px 12px', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={reportLoading}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, background: '#1F5A44', color: '#FAF8F5', border: 'none', borderRadius: 9, padding: '10px 16px', cursor: 'pointer' }}
            >
              Envoyer
            </button>
            <button
              type="button"
              onClick={() => { setReportOpen(false); setReportDraft('') }}
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, background: 'transparent', color: '#6B6560', border: 'none', padding: '10px 4px', cursor: 'pointer' }}
            >
              Annuler
            </button>
          </form>
        </div>
      )}

      {/* d) Pied fixe */}
      <div style={{ borderTop: '1px solid #E7E1D9', background: '#FDFCFA', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexShrink: 0 }}>
        {d.lien_officiel ? (
          <a href={d.lien_officiel} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, fontWeight: 600, color: '#E2703A', textDecoration: 'none' }}>
            Lien officiel →
          </a>
        ) : <span />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {verifiedAt && <span style={{ fontSize: 12.5, color: '#8A8378' }}>Vérifié le {verifiedAt}</span>}
          {reportSent ? (
            <span style={{ fontSize: 12.5, color: '#1F5A44', fontWeight: 600 }}>✓ Signalement transmis</span>
          ) : !reportOpen ? (
            <button
              onClick={() => setReportOpen(true)}
              style={{ fontSize: 12.5, color: '#8A8378', background: 'none', border: 'none', borderBottom: '1px solid #E7E1D9', padding: 0, cursor: 'pointer' }}
            >
              Signaler une information erronée
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── CatalogueContent ──────────────────────────────────────────────────────────

function CatalogueContent({ dispositifs }: { dispositifs: Dispositif[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const aideParam = searchParams.get('aide')

  const [filtre, setFiltre] = useState<string>('tous')
  const [selectedId, setSelectedId] = useState<string | null>(aideParam)

  const liste = filtre === 'tous'
    ? dispositifs
    : dispositifs.filter((d) => d.categorie === filtre)

  // Resolve selected device
  const selected = liste.find((d) => (d.slug ?? d.id) === selectedId) ?? liste[0] ?? null

  // Auto-select first item when filter changes (if current selection not in filtered list)
  useEffect(() => {
    if (liste.length > 0 && !liste.find((d) => (d.slug ?? d.id) === selectedId)) {
      const first = liste[0]
      setSelectedId(first.slug ?? first.id)
    }
  }, [filtre]) // eslint-disable-line react-hooks/exhaustive-deps

  // Init from URL param
  useEffect(() => {
    if (aideParam) setSelectedId(aideParam)
  }, [aideParam])

  function handleSelect(d: Dispositif) {
    const slug = d.slug ?? d.id
    setSelectedId(slug)
    const url = new URL(window.location.href)
    url.searchParams.set('aide', slug)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const categoriesPresentes = [...new Set(dispositifs.map((d) => d.categorie).filter(Boolean) as string[])]
  const filtres = [
    { key: 'tous', label: 'Tous' },
    ...categoriesPresentes.map((cat) => ({ key: cat, label: LABELS.categorie_dispositif?.[cat] ?? cat })),
  ]

  return (
    <>
      <style>{`
        @media (max-width: 999px) {
          .catalogue-grid { grid-template-columns: 1fr !important; }
          .catalogue-list-col { height: auto !important; max-height: 220px; }
          .catalogue-detail-col { height: auto !important; min-height: 600px; }
          .catalogue-shell { height: auto !important; min-height: unset !important; }
        }
      `}</style>

      <div
        className="catalogue-shell"
        style={{ padding: '20px 24px', flex: 1, minHeight: 620, display: 'flex', flexDirection: 'column' }}
      >
        {/* En-tête compact */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 25, letterSpacing: '-0.015em', margin: 0 }}>Catalogue des dispositifs</h1>
            <span style={{ fontSize: 13.5, color: '#8A8378' }}>{liste.length} dispositifs</span>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '0 0 14px', flexShrink: 0 }}>
          {filtres.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              style={{
                fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 100, cursor: 'pointer',
                background: filtre === f.key ? '#221F1D' : '#F1EEE9',
                color: filtre === f.key ? '#FAF8F5' : '#6B6560',
                border: `1px solid ${filtre === f.key ? '#221F1D' : '#E7E1D9'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grille maître-détail */}
        <div
          className="catalogue-grid"
          style={{ display: 'grid', gridTemplateColumns: '344px minmax(0,1fr)', gap: 18, flex: 1, minHeight: 480 }}
        >
          {/* Colonne gauche — liste */}
          <div
            className="catalogue-list-col"
            style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ padding: '13px 18px', borderBottom: '1px solid #E7E1D9', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A8378', flexShrink: 0 }}>
              {liste.length} dispositifs
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {liste.map((d) => {
                const slug = d.slug ?? d.id
                const isSelected = selected?.id === d.id
                const montant = formatMontant(d)
                const categorieLabel = d.categorie ? LABELS.categorie_dispositif?.[d.categorie] ?? d.categorie : '—'
                return (
                  <div
                    key={d.id}
                    onClick={() => handleSelect(d)}
                    style={{ padding: '15px 18px', borderBottom: '1px solid #F1EEE9', cursor: 'pointer', background: isSelected ? '#F7FAF8' : 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: isSelected ? '#1F5A44' : '#221F1D', lineHeight: 1.35, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.nom}
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: '#4A453F', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {montant}
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#8A8378', marginTop: 4, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.short_desc ?? d.organisme}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
                      <span style={{ background: '#EFEAF7', color: '#5A4A78', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100 }}>
                        {categorieLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
              {liste.length === 0 && (
                <div style={{ padding: '40px 18px', textAlign: 'center', color: '#8A8378', fontSize: 13 }}>
                  Aucun dispositif dans cette catégorie.
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite — panneau de détail */}
          <div className="catalogue-detail-col" style={{ height: '100%' }}>
            {selected ? (
              <DetailPanel key={selected.id} d={selected} />
            ) : (
              <div style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 16, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, color: '#8A8378' }}>Sélectionnez un dispositif dans la liste.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── export ────────────────────────────────────────────────────────────────────

export default function CatalogueClient({ dispositifs }: { dispositifs: Dispositif[] }) {
  return (
    <Suspense>
      <CatalogueContent dispositifs={dispositifs} />
    </Suspense>
  )
}
