'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogoFondoukBeta } from '@/components/layout/LogoFondouk'
import CarteDispositif from '@/components/resultats/CarteDispositif'
import type { Resultat, Pays } from '@/types'
import { LABELS, ORDRE_CATEGORIES } from '@/lib/labels'
import { createClient } from '@/lib/supabase/client'

interface Props {
  diagnosticId: string
  resultats: Resultat[]
  demandesExistantes: Set<string>
  dispositifsDebloques: Set<string>
  pays?: Pays
  nomEntreprise?: string
  soldeInitial?: number
}

export default function ResultatsClient({
  diagnosticId, resultats, demandesExistantes, dispositifsDebloques,
  pays = 'MA', nomEntreprise, soldeInitial = 0,
}: Props) {
  const [demandes] = useState<Set<string>>(demandesExistantes)
  const [filtreActif, setFiltreActif] = useState<'accessibles' | 'tous'>('accessibles')
  const [isBeta, setIsBeta] = useState(false)
  const [solde, setSolde] = useState(soldeInitial)

  useEffect(() => {
    const checkBeta = () => setIsBeta(window.location.hash === '#versionBeta')
    checkBeta()
    window.addEventListener('hashchange', checkBeta)
    return () => window.removeEventListener('hashchange', checkBeta)
  }, [])

  useEffect(() => {
    if (!isBeta) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('credits').select('solde').eq('user_id', user.id).single()
      if (data) setSolde(data.solde)
    })
  }, [isBeta])

  const eligibles = resultats.filter((r) => r.statut !== 'non_eligible')
  const resultatsAffiches = filtreActif === 'accessibles'
    ? resultats.filter((r) => r.statut !== 'non_eligible')
    : resultats
  const devise = pays === 'FR' ? 'EUR' : 'MAD'
  const montantTotal = resultats.reduce((sum, r) => {
    if (r.statut !== 'non_eligible' && r.dispositif?.montant_max) return sum + r.dispositif.montant_max
    return sum
  }, 0)

  // Groupes par catégorie
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
              <LogoFondoukBeta height={42} />
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isBeta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4A453F' }}>
                  <span style={{ color: '#1F5A44', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{solde}</span> crédit{solde !== 1 ? 's' : ''}
                </div>
                <Link href="/recharger"
                  style={{ fontSize: 12.5, fontWeight: 700, background: '#F1EEE9', color: '#221F1D', borderRadius: 8, padding: '6px 12px', textDecoration: 'none' }}>
                  Recharger
                </Link>
              </div>
            )}
            <Link href="/tableau-de-bord"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, background: '#1F5A44', color: '#FAF8F5', borderRadius: 9, padding: '10px 20px', textDecoration: 'none' }}>
              Mon tableau de bord →
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '44px 32px 90px' }}>

        {/* ── En-tête ── */}
        <div style={{ marginBottom: 36 }}>
          {isBeta && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1EEE9', border: '1px solid #E7E1D9', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#6B6560', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Version gratuite
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8A8378', marginBottom: 8 }}>Diagnostic d&apos;éligibilité</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: '-0.01em', margin: 0 }}>
            {eligibles.length} dispositif{eligibles.length > 1 ? 's' : ''} pour {nomEntreprise}
          </h1>
          {isBeta && (
            <p style={{ fontSize: 14, color: '#6B6560', marginTop: 10, lineHeight: 1.6 }}>
              Voici les aides publiques auxquelles votre profil est éligible. Débloquez un dossier guidé pour chaque dispositif que vous souhaitez monter.
            </p>
          )}
        </div>

        {/* ── Filtre ── */}
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
                    <strong>Tamwilcom ne prête pas directement :</strong> la demande passe par votre banque, l'État garantit une partie du crédit.
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {items.map((r) => (
                    <CarteDispositif
                      key={r.id}
                      resultat={r}
                      isBeta={isBeta}
                      solde={solde}
                      dispositifDebloque={dispositifsDebloques.has(r.dispositif_id)}
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
                    isBeta={isBeta}
                    solde={solde}
                    dispositifDebloque={dispositifsDebloques.has(r.dispositif_id)}
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
                isBeta={isBeta}
                solde={solde}
                dispositifDebloque={dispositifsDebloques.has(r.dispositif_id)}
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

        {/* ── Encart "Ce que débloque un crédit" (beta only) ── */}
        {isBeta && eligibles.length > 0 && (
          <div style={{ marginTop: 48, border: '2px dashed #C9BFAE', borderRadius: 16, padding: '28px 32px' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              Ce que débloque 1 crédit
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Vérification guidée de votre éligibilité, critère par critère',
                'Liste personnalisée des documents à préparer',
                'Parcours de dépôt étape par étape avec conseils pratiques',
                'Dossier complet à télécharger, accessible indéfiniment',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: '#4A453F', lineHeight: 1.5 }}>
                  <span style={{ color: '#1F5A44', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, fontSize: 13, color: '#8A8378', fontWeight: 600 }}>
              1 crédit · dossier · accessible sans limite de temps
            </div>
          </div>
        )}

        <p style={{ fontSize: 12, color: '#8A8378', textAlign: 'center', marginTop: 48 }}>
          Ces résultats sont indicatifs. Vérifiez votre éligibilité définitive auprès des organismes concernés. Dernière vérification : juin 2026.
        </p>
      </div>
    </div>
  )
}
