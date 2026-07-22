'use client'

import { useTransition } from 'react'
import { toggleArchiveDossier } from './actions'

export default function ArchiverDossier({ demandeId, archivee }: { demandeId: string; archivee: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => toggleArchiveDossier(demandeId, archivee))}
      disabled={pending}
      className="text-[11px] transition disabled:opacity-40 opacity-0 group-hover:opacity-100"
      style={{ color: archivee ? 'var(--corail)' : 'var(--ardoise-clair)' }}
      title={archivee ? 'Désarchiver' : 'Archiver ce dossier'}
    >
      {pending ? '…' : archivee ? 'Désarchiver' : 'Archiver'}
    </button>
  )
}
