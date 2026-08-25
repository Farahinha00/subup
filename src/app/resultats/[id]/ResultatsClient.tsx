'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/layout/LogoFondouk'
import CarteDispositif from '@/components/resultats/CarteDispositif'
import type { Resultat, Pays } from '@/types'
import { LABELS, ORDRE_CATEGORIES } from '@/lib/labels'
import { createClient } from '@/lib/supabase/client'

interface Props {
  diagnosticId: string
  resultats: Resultat[]
  pays?: Pays
  nomEntreprise?: string
}

const BADGE_PROCHAINEMENT: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontWeight: 700,
  fontSize: 11.5,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: '#fff',
  border: '1px solid #E7E1D9',
  borderRadius: 100,
  padding: '3px 8px',
  color: '#8A8378',
}

export default function ResultatsClient({
  diagnosticId, resultats,
  pays = 'MA', nomEntreprise,
}: Props) {
  const [filtreActif, setFiltreActif] = useState<'accessibles' | 'tous'>('accessibles')
  const [waitlistSent, setWaitlistSent] = useState(false)
  const [waitlistLoading, setWaitlistLoading] = useState(false)

  const eligibles = resultats.filter((r) => r.statut !== 'non_eligible')
  const resultatsAffiches = filtreActif === 'accessibles'
    ? resultats.filter((r) => r.statut !== 'non_eligible')
    : resultats
  const devise = pays === 'FR' ? 'EUR' : 'MAD'
  const montantTotal = resultats.reduce((sum, r) => {
    if (r.statut !== 'non_eligible' && r.dispositif?.montant_max) return sum + r.dispositif.montant_max
    return sum
  }, 0)

  const groupes: Array<{ categorie: string; label: string; items: Resultat[] }> = []
  const sansCategorie: Resultat[] = []
  const map = new Map<string, Resultat[]>()
  for (const r of resultatsAffiches) {
    const cat = r.dispositif?.categorie ?? null
    if (cat) {
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(r)
    } else {
      sansCategorie.push(r)
    }
  }
  for (const cat of ORDRE_CATEGORIES) {
    if (map.has(cat)) {
      groupes.push({ categorie: cat, label: LABELS.categorie_dispositif[cat] ?? cat, items: map.get(cat)! })
    }
  }

  const formatMontantTotal = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} M ${devise}`
    if (v >= 1_000) return `${Math.round(v / 1_000)} K ${devise}`
    return `${v} ${devise}`
  }

  async function handleWaitlist() {
    setWaitlistLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        await supabase.from('waitlist_entries').insert({ email: user.email, source: 'resultats' })
      }
      setWaitlistSent(true)
    } catch {
      setWaitlistSent(true)
    } finally {
      setWaitlistLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#FAF8F5', color: '#221F1D', minHeight: '100vh' }}>

      {/* ── Topbar sticky ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(250,248,245,0.92)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E7E1D9',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/tableau-de-bord" style={{ fontSize: 14, fontWeight: 600, color: '#8A8378', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              ← Tableau de bord
            </Link>
            <div style={{ width: 1, height: 18, background: '#E7E1D9' }} />
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Logo size="nav" variant="beta" />
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Crédits dossier — Prochainement */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px dashed #C9BFAE', borderRadius: 100 }}>
              <span style={{ fontSize: 13, color: '#8A8378', fontWeight: 500 }}>Crédits dossier</span>
              <span style={BADGE_PROCHAINEMENT}>PROCHAINEMENT</span>
            </div>
            <Link href="/tableau-de-bord/catalogue"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5, background: '#F1EEE9', color: '#4A453F', borderRadius: 9, padding: '9px 18px', textDecoration: 'none' }}>
              Catalogue
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '44px 32px 90px' }}>

        {/* ── En-tête ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1EEE9', border: '1px solid #E7E1D9', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#6B6560', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Version gratuite
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: '-0.01em', margin: '0 0 8px' }}>
            {eligibles.length} dispositif{eligibles.length > 1 ? 's' : ''} pour {nomEntreprise}
          </h1>
          <p style={{ fontSize: 14, color: '#6B6560', margin: 0, lineHeight: 1.6 }}>
            Voici les aides auxquelles vous êtes éligible, avec l&apos;essentiel à savoir. Le montage de dossier arrive prochainement.
          </p>
        </div>

        {/* ── Filtres ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['accessibles', 'tous'] as const).map((f) => (
            <button key={f} onClick={() => setFiltreActif(f)}
              style={{
                padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid',
                borderColor: filtreActif === f ? '#1F5A44' : '#E7E1D9',
                background: filtreActif === f ? '#1F5A44' : '#fff',
                color: filtreActif === f ? '#fff' : '#8A8378',
              }}>
              {f === 'accessibles'
                ? `Éligibles (${eligibles.length})`
                : `Tous (${resultats.length})`}
            </button>
          ))}
        </div>

        {/* ── 3 stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: `Dispositif${eligibles.length > 1 ? 's' : ''} accessible${eligibles.length > 1 ? 's' : ''}`, value: String(eligibles.length), color: '#1F5A44' },
            { label: 'Analysés', value: String(resultats.length), color: '#221F1D' },
            { label: `${devise} potentiels`, value: montantTotal > 0 ? formatMontantTotal(montantTotal) : '—', color: '#221F1D' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#8A8378', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Résultats ── */}
        {groupes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {groupes.map(({ categorie, label, items }) => (
              <div key={categorie}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, margin: 0 }}>{label}</h2>
                  <div style={{ flex: 1, height: 1, background: '#E7E1D9' }} />
                  <span style={{ fontSize: 12, color: '#8A8378' }}>
                    {items.filter((r) => r.statut !== 'non_eligible').length}/{items.length} accessible{items.filter((r) => r.statut !== 'non_eligible').length > 1 ? 's' : ''}
                  </span>
                </div>
                {categorie === 'financement_garantie' && (
                  <div style={{ background: '#EAF3EE', border: '1px solid #C0DAC9', borderRadius: 12, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#1F5A44' }}>
                    <strong>Tamwilcom ne prête pas directement :</strong> la demande passe par votre banque, l&apos;État garantit une partie du crédit.
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {items.map((r) => (
                    <CarteDispositif
                      key={r.id}
                      resultat={r}
                      diagnosticId={diagnosticId}
                    />
                  ))}
                </div>
              </div>
            ))}
            {sansCategorie.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sansCategorie.map((r) => (
                  <CarteDispositif
                    key={r.id}
                    resultat={r}
                    diagnosticId={diagnosticId}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {resultats.map((r) => (
              <CarteDispositif
                key={r.id}
                resultat={r}
                diagnosticId={diagnosticId}
              />
            ))}
          </div>
        )}

        {resultatsAffiches.length === 0 && resultats.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 18, padding: '48px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#8A8378', marginBottom: 16 }}>Aucun dispositif accessible avec votre profil.</p>
            <button onClick={() => setFiltreActif('tous')}
              style={{ fontSize: 13, fontWeight: 600, color: '#1F5A44', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Voir tous les dispositifs analysés →
            </button>
          </div>
        )}
        {resultats.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid #E7E1D9', borderRadius: 18, padding: '48px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#8A8378' }}>Aucun résultat disponible pour ce diagnostic.</p>
          </div>
        )}

        {/* ── Encart waitlist ── */}
        <div style={{ marginTop: 56, border: '2px dashed #C9BFAE', borderRadius: 18, padding: '32px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17 }}>
                  Le montage de dossier
                </span>
                <span style={BADGE_PROCHAINEMENT}>PROCHAINEMENT</span>
              </div>
              <p style={{ fontSize: 14, color: '#6B6560', lineHeight: 1.7, margin: 0, maxWidth: 520 }}>
                Vérification des critères bloquants, liste nominative des pièces, modèles pré-remplis à télécharger et étapes de dépôt commentées jusqu&apos;au décaissement — pour chacun de vos dispositifs.
              </p>
            </div>
          </div>

          {waitlistSent ? (
            <div style={{ fontSize: 14, color: '#1F5A44', fontWeight: 600 }}>
              ✓ Vous serez prévenu au lancement. Merci !
            </div>
          ) : (
            <button
              onClick={handleWaitlist}
              disabled={waitlistLoading}
              style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5,
                color: '#1F5A44', border: '1px solid #DCE9E2', background: '#F7FAF8',
                borderRadius: 10, padding: '11px 18px', cursor: 'pointer',
              }}
            >
              {waitlistLoading ? 'Envoi...' : 'Être prévenu au lancement'}
            </button>
          )}
        </div>

        <p style={{ fontSize: 12, color: '#8A8378', textAlign: 'center', marginTop: 40 }}>
          Ces résultats sont indicatifs. Vérifiez votre éligibilité définitive auprès des organismes concernés. Dernière vérification : août 2026.
        </p>
      </div>
    </div>
  )
}
