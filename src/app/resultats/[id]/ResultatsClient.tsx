'use client'

import { useState } from 'react'
import Link from 'next/link'
import CarteDispositif from '@/components/resultats/CarteDispositif'
import type { Resultat, Pays } from '@/types'
import { LABELS, ORDRE_CATEGORIES } from '@/lib/labels'
import { createClient } from '@/lib/supabase/client'

interface Props {
  diagnosticId: string
  resultats: Resultat[]
  demandesExistantes: Set<string>
  pays?: Pays
  nomEntreprise?: string
}

export default function ResultatsClient({ diagnosticId, resultats, demandesExistantes, pays = 'MA', nomEntreprise }: Props) {
  const [demandes, setDemandes] = useState<Set<string>>(demandesExistantes)
  const [loadingDemande, setLoadingDemande] = useState<string | null>(null)
  const [filtreActif, setFiltreActif] = useState<'accessibles' | 'tous'>('accessibles')

  const eligibles = resultats.filter((r) => r.statut !== 'non_eligible')
  const resultatsAffiches = filtreActif === 'accessibles'
    ? resultats.filter((r) => r.statut !== 'non_eligible')
    : resultats
  const devise = pays === 'FR' ? 'EUR' : 'MAD'
  const montantTotal = resultats.reduce((sum, r) => {
    if (r.statut !== 'non_eligible' && r.dispositif?.montant_max) return sum + r.dispositif.montant_max
    return sum
  }, 0)

  const eligiblesDeMinimis = eligibles.filter((r) => r.dispositif?.soumis_de_minimis === true)
  const showDeMinimis = pays === 'FR' && eligiblesDeMinimis.length >= 2

  async function handleDemande(dispositifId: string) {
    if (loadingDemande) return
    setLoadingDemande(dispositifId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('demandes_accompagnement').insert({
      user_id: user.id,
      diagnostic_id: diagnosticId,
      dispositif_id: dispositifId,
    })
    setDemandes((prev) => new Set([...prev, dispositifId]))
    setLoadingDemande(null)
  }

  // Groupes par catégorie (sur les résultats filtrés)
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
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/tableau-de-bord" style={{ fontSize: 14, fontWeight: 600, color: '#8A8378', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              ← Retour
            </Link>
            <div style={{ width: 1, height: 18, background: '#E7E1D9' }} />
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#1F5A44', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 100 100">
                  <polygon points="50,14 86,52 68,52 68,88 32,88 32,52 14,52" fill="#FAF8F5" />
                </svg>
              </div>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#221F1D' }}>sub&apos;up</span>
            </Link>
          </div>
          <Link href="/tableau-de-bord"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, background: '#1F5A44', color: '#FAF8F5', borderRadius: 9, padding: '10px 20px', textDecoration: 'none' }}>
            Mon tableau de bord →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '44px 32px 90px' }}>

        {/* ── En-tête ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8A8378', marginBottom: 8 }}>Diagnostic d&apos;éligibilité</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: '-0.01em', margin: 0 }}>
            {nomEntreprise}
          </h1>
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

        {/* ── Avertissements ── */}
        {pays === 'FR' && (
          <div style={{ background: '#EAF3EE', border: '1px solid #C0DAC9', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#1F5A44', lineHeight: 1.6 }}>
            <strong>Note :</strong> Résultats indicatifs. Vérifiez votre éligibilité définitive auprès de Bpifrance ou de la DGFiP.
          </div>
        )}
        {showDeMinimis && (
          <div style={{ background: '#FFF6EF', border: '1px solid #F3D8C2', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#7A4A2E', lineHeight: 1.6 }}>
            <strong>⚠ Plafond de minimis :</strong> plusieurs dispositifs sont soumis à la règle européenne (max 300 000 € / 3 exercices). Faites vérifier le cumul par un expert.
          </div>
        )}

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
                    <CarteDispositif key={r.id} resultat={r} onDemandeAccompagnement={handleDemande} demandeEnvoyee={demandes.has(r.dispositif_id)} loadingDemande={loadingDemande} diagnosticId={diagnosticId} />
                  ))}
                </div>
              </div>
            ))}
            {sansCategorie.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sansCategorie.map((r) => (
                  <CarteDispositif key={r.id} resultat={r} onDemandeAccompagnement={handleDemande} demandeEnvoyee={demandes.has(r.dispositif_id)} loadingDemande={loadingDemande} diagnosticId={diagnosticId} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {resultats.map((r) => (
              <CarteDispositif key={r.id} resultat={r} onDemandeAccompagnement={handleDemande} demandeEnvoyee={demandes.has(r.dispositif_id)} loadingDemande={loadingDemande} diagnosticId={diagnosticId} />
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

        <p style={{ fontSize: 12, color: '#8A8378', textAlign: 'center', marginTop: 48 }}>
          Ces résultats sont indicatifs. Vérifiez votre éligibilité définitive auprès des organismes concernés. Dernière vérification : juin 2026.
        </p>
      </div>
    </div>
  )
}
