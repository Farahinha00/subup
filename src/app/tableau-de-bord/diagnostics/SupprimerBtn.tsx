'use client'

import { useTransition } from 'react'
import { supprimerDiagnostic } from './actions'

export default function SupprimerBtn({ diagnosticId }: { diagnosticId: string }) {
  const [pending, start] = useTransition()

  return (
    <button
      onClick={() => {
        if (!window.confirm('Supprimer ce diagnostic ?')) return
        start(() => supprimerDiagnostic(diagnosticId))
      }}
      disabled={pending}
      title="Supprimer"
      className="flex items-center justify-center rounded-full transition-colors"
      style={{ width: 28, height: 28, color: '#C9BFAE', flexShrink: 0 }}
      onMouseEnter={e => (e.currentTarget.style.color = '#E2703A')}
      onMouseLeave={e => (e.currentTarget.style.color = '#C9BFAE')}
    >
      {pending ? '…' : '×'}
    </button>
  )
}
