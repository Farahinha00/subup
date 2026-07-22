'use client'

import { useState, useTransition } from 'react'
import { supprimerDiagnostic } from './actions'

export default function SupprimerDiagnostic({ diagnosticId }: { diagnosticId: string }) {
  const [confirme, setConfirme] = useState(false)
  const [pending, startTransition] = useTransition()

  if (confirme) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-ardoise-clair">Supprimer ?</span>
        <button
          onClick={() => startTransition(() => supprimerDiagnostic(diagnosticId))}
          disabled={pending}
          className="text-[11px] font-semibold text-red-500 hover:text-red-700 transition disabled:opacity-40"
        >
          {pending ? '…' : 'Oui'}
        </button>
        <button
          onClick={() => setConfirme(false)}
          className="text-[11px] text-ardoise-clair hover:text-ardoise transition"
        >
          Non
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirme(true)}
      className="text-[11px] text-ardoise-clair hover:text-red-500 transition opacity-0 group-hover:opacity-100"
      title="Supprimer ce diagnostic"
    >
      Supprimer
    </button>
  )
}
