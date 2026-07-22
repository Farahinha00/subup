'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LABELS } from '@/lib/labels'
import type { StatutDemande, Pays } from '@/types'

interface DemandeRow {
  id: string
  statut: StatutDemande
  created_at: string
  message: string | null
  profile: { prenom: string; nom: string; entreprise: string } | null
  dispositif: { nom: string; slug: string } | null
}

interface UtilisateurRow {
  id: string
  prenom: string | null
  nom: string | null
  entreprise: string | null
  ville: string | null
  role: string
  created_at: string
  diagnostics: { count: number }[]
}

interface DispositifRow {
  id: string
  slug: string
  nom: string
  organisme: string
  type_aide: string
  categorie: string | null
  pays: string
  actif: boolean
  guichet_ouvert: boolean
}

interface Stats {
  totalUtilisateurs: number
  totalDiagnostics: number
  totalDemandes: number
  nouvellesDemandes: number
}

const STATUTS: StatutDemande[] = ['nouvelle', 'contactee', 'signee', 'perdue']
const COULEUR_STATUT: Record<StatutDemande, string> = {
  nouvelle: 'bg-blue-100 text-blue-800',
  contactee: 'bg-amber-100 text-amber-800',
  signee: 'bg-green-100 text-green-800',
  perdue: 'bg-gray-100 text-gray-600',
}

export default function AdminClient({
  demandes: initial, utilisateurs, dispositifs, paysActifs, stats,
}: {
  demandes: DemandeRow[]
  utilisateurs: UtilisateurRow[]
  dispositifs: DispositifRow[]
  paysActifs: Pays[]
  stats: Stats
}) {
  const [demandes, setDemandes] = useState(initial)
  const [onglet, setOnglet] = useState<'demandes' | 'utilisateurs' | 'dispositifs'>('demandes')
  const [updating, setUpdating] = useState<string | null>(null)
  const [showArchives, setShowArchives] = useState(false)

  async function changerStatut(id: string, statut: StatutDemande) {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('demandes_accompagnement').update({ statut }).eq('id', id)
    setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, statut } : d))
    setUpdating(null)
  }

  const dispositifsFiltres = showArchives
    ? dispositifs
    : dispositifs.filter((d) => paysActifs.includes(d.pays as Pays))

  const hasArchives = dispositifs.some((d) => !paysActifs.includes(d.pays as Pays))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-vert-profond">Back-office admin</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble et gestion des demandes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Utilisateurs', val: stats.totalUtilisateurs, color: 'text-vert-profond' },
          { label: 'Diagnostics', val: stats.totalDiagnostics, color: 'text-blue-600' },
          { label: 'Demandes', val: stats.totalDemandes, color: 'text-amber-600' },
          { label: 'Nouvelles', val: stats.nouvellesDemandes, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b">
        {([
          ['demandes', `Demandes (${demandes.length})`],
          ['utilisateurs', `Utilisateurs (${utilisateurs.length})`],
          ['dispositifs', `Dispositifs (${dispositifsFiltres.length})`],
        ] as const).map(([o, label]) => (
          <button
            key={o}
            onClick={() => setOnglet(o)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              onglet === o ? 'border-vert-profond text-vert-profond' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table demandes */}
      {onglet === 'demandes' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Contact</th>
                <th className="pb-3 pr-4">Dispositif</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {demandes.map((d) => (
                <tr key={d.id} className="py-3 hover:bg-gray-50">
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-gray-900">{d.profile?.prenom} {d.profile?.nom}</div>
                    <div className="text-gray-400 text-xs">{d.profile?.entreprise}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-medium text-gray-700">{d.dispositif?.nom}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${COULEUR_STATUT[d.statut]}`}>
                      {LABELS.statut_demande[d.statut]}
                    </span>
                  </td>
                  <td className="py-3">
                    <select
                      value={d.statut}
                      onChange={(e) => changerStatut(d.id, e.target.value as StatutDemande)}
                      disabled={updating === d.id}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-vert-moyen"
                    >
                      {STATUTS.map((s) => (
                        <option key={s} value={s}>{LABELS.statut_demande[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {demandes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">Aucune demande pour le moment</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table utilisateurs */}
      {onglet === 'utilisateurs' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Nom</th>
                <th className="pb-3 pr-4">Entreprise</th>
                <th className="pb-3 pr-4">Ville</th>
                <th className="pb-3 pr-4">Diagnostics</th>
                <th className="pb-3">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {utilisateurs.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 pr-4 font-medium text-gray-900">{u.prenom} {u.nom}</td>
                  <td className="py-3 pr-4 text-gray-600">{u.entreprise ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-500">{u.ville ?? '—'}</td>
                  <td className="py-3 pr-4 text-center font-semibold text-vert-profond">
                    {u.diagnostics?.[0]?.count ?? 0}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'admin' ? 'bg-vert-profond text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table dispositifs */}
      {onglet === 'dispositifs' && (
        <div>
          {/* Toggle pays archivés */}
          {hasArchives && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {showArchives
                  ? 'Tous les dispositifs (pays actifs + archivés)'
                  : `Pays actifs uniquement : ${paysActifs.join(', ')}`}
              </p>
              <button
                onClick={() => setShowArchives((v) => !v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
                  showArchives
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {showArchives ? '← Masquer les pays archivés' : '🗂 Voir les pays archivés'}
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b">
                  <th className="pb-3 pr-4">Pays</th>
                  <th className="pb-3 pr-4">Dispositif</th>
                  <th className="pb-3 pr-4">Organisme</th>
                  <th className="pb-3 pr-4">Catégorie</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dispositifsFiltres.map((d) => {
                  const isArchive = !paysActifs.includes(d.pays as Pays)
                  return (
                    <tr key={d.id} className={`hover:bg-gray-50 ${isArchive ? 'opacity-60' : ''}`}>
                      <td className="py-3 pr-4">
                        <span className="text-base">{d.pays === 'MA' ? '🇲🇦' : '🇫🇷'}</span>
                        {isArchive && (
                          <span className="ml-1 text-xs text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-100">
                            archivé
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-900">{d.nom}</div>
                        <div className="text-gray-400 text-xs font-mono">{d.slug}</div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 text-xs">{d.organisme}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {d.categorie ? (LABELS.categorie_dispositif[d.categorie] ?? d.categorie) : '—'}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {LABELS.type_aide[d.type_aide] ?? d.type_aide}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          d.actif
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {d.actif ? 'Actif' : 'Inactif'}
                        </span>
                        {!d.guichet_ouvert && (
                          <span className="ml-1 text-xs text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">
                            AAP
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {dispositifsFiltres.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">Aucun dispositif</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
