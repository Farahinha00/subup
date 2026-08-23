'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { LogoFondoukBeta } from '@/components/layout/LogoFondouk'
import StepperNav from '@/components/dossier/StepperNav'
import Etape1Eligibilite from '@/components/dossier/Etape1Eligibilite'
import Etape2Documents from '@/components/dossier/Etape2Documents'
import Etape3Depot from '@/components/dossier/Etape3Depot'
import BarreValidation from '@/components/dossier/BarreValidation'
import type { Dispositif } from '@/types'

interface Props {
  diagnosticId: string
  dispositif: Dispositif
  initialChecksDone: string[]
  initialDocsDone: string[]
  initialDepositDone: string[]
  initialStepsValidated: number[]
}

async function saveProgress(dispositifId: string, patch: Record<string, unknown>) {
  await fetch('/api/dossier/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dispositifId, ...patch }),
  })
}

export default function DossierClient({
  diagnosticId, dispositif,
  initialChecksDone, initialDocsDone, initialDepositDone, initialStepsValidated,
}: Props) {
  const [etapeActive, setEtapeActive] = useState<1 | 2 | 3>(
    initialStepsValidated.includes(2) ? 3 : initialStepsValidated.includes(1) ? 2 : 1
  )
  const [checksDone, setChecksDone] = useState<string[]>(initialChecksDone)
  const [docsDone, setDocsDone] = useState<string[]>(initialDocsDone)
  const [depositDone, setDepositDone] = useState<string[]>(initialDepositDone)
  const [stepsValidated, setStepsValidated] = useState<number[]>(initialStepsValidated)

  const checkItems = dispositif.check_items ?? []
  const docs = dispositif.docs_parcours ?? []
  const depotSteps = dispositif.depot_steps ?? []
  const validCriteria = dispositif.valid_criteria ?? []

  const etape1Complete = checkItems.every((c) => checksDone.includes(c.id))
  const etape2Complete = docs.every((d) => docsDone.includes(d.id))
  const etape3Complete = depotSteps.every((s) => depositDone.includes(s.id))

  const etapeComplete = etapeActive === 1 ? etape1Complete : etapeActive === 2 ? etape2Complete : etape3Complete

  const toggleCheck = useCallback((id: string) => {
    setChecksDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      saveProgress(dispositif.id, { checks_done: next })
      return next
    })
  }, [dispositif.id])

  const toggleDoc = useCallback((id: string) => {
    setDocsDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      saveProgress(dispositif.id, { docs_done: next })
      return next
    })
  }, [dispositif.id])

  const toggleDeposit = useCallback((id: string) => {
    setDepositDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      saveProgress(dispositif.id, { deposit_done: next })
      return next
    })
  }, [dispositif.id])

  function validerEtape() {
    const next = [...new Set([...stepsValidated, etapeActive])]
    setStepsValidated(next)
    saveProgress(dispositif.id, { steps_validated: next })
    if (etapeActive < 3) {
      const nextEtape = (etapeActive + 1) as 1 | 2 | 3
      setEtapeActive(nextEtape)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function precedent() {
    if (etapeActive > 1) {
      setEtapeActive((n) => (n - 1) as 1 | 2 | 3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const s1 = stepsValidated.includes(1) ? 'validee' : etapeActive === 1 ? 'en_cours' : 'a_faire'
  const s2 = stepsValidated.includes(2) ? 'validee' : etapeActive === 2 ? 'en_cours' : 'a_faire'
  const s3 = stepsValidated.includes(3) ? 'validee' : etapeActive === 3 ? 'en_cours' : 'a_faire'
  const ETAPES_INFO: [{ titre: string; statut: 'validee' | 'en_cours' | 'a_faire' }, { titre: string; statut: 'validee' | 'en_cours' | 'a_faire' }, { titre: string; statut: 'validee' | 'en_cours' | 'a_faire' }] = [
    { titre: "Vérifier l'éligibilité", statut: s1 },
    { titre: 'Préparer les documents', statut: s2 },
    { titre: 'Déposer la candidature', statut: s3 },
  ]

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#FAF8F5', color: '#221F1D', minHeight: '100vh', paddingBottom: 120 }}>

      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(250,248,245,0.92)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E7E1D9',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              href={`/resultats/${diagnosticId}#versionBeta`}
              style={{ fontSize: 14, fontWeight: 600, color: '#8A8378', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              ← Résultats
            </Link>
            <div style={{ width: 1, height: 18, background: '#E7E1D9' }} />
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <LogoFondoukBeta height={42} />
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '44px 32px 0' }}>

        {/* En-tête */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8A8378', marginBottom: 6 }}>Montage de dossier</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: '-0.01em', margin: '0 0 4px' }}>
            {dispositif.nom}
          </h1>
          {dispositif.operateur && (
            <div style={{ fontSize: 13.5, color: '#8A8378' }}>{dispositif.operateur}</div>
          )}
        </div>

        {/* Stepper */}
        <StepperNav
          etapeActive={etapeActive}
          etapes={ETAPES_INFO}
          onNavigate={setEtapeActive}
        />

        {/* Contenu de l'étape */}
        {etapeActive === 1 && (
          <Etape1Eligibilite
            validCriteria={validCriteria}
            checkItems={checkItems}
            checksDone={checksDone}
            onToggle={toggleCheck}
          />
        )}
        {etapeActive === 2 && (
          <Etape2Documents
            docs={docs}
            docsDone={docsDone}
            dispositifId={dispositif.id}
            onToggle={toggleDoc}
          />
        )}
        {etapeActive === 3 && (
          <Etape3Depot
            steps={depotSteps}
            depositDone={depositDone}
            dispositifId={dispositif.id}
            onToggle={toggleDeposit}
          />
        )}
      </div>

      {/* Barre validation sticky */}
      <BarreValidation
        etapeActive={etapeActive}
        etapeComplete={etapeComplete}
        stepsValidated={stepsValidated}
        onPrecedent={precedent}
        onValider={validerEtape}
      />
    </div>
  )
}
