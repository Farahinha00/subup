import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Dispositif, CategorieDispositif } from '@/types'

// ---- Config affichage ----

const OPERATEURS_ORDRE = [
  {
    key: 'Maroc PME',
    desc: 'Accompagnement, financement et innovation pour TPME marocaines',
    url: 'https://www.marocpme.gov.ma',
  },
  {
    key: 'Tamwilcom',
    desc: 'Garanties bancaires et prêts bonifiés via le système bancaire partenaire',
    url: 'https://www.tamwilcom.ma',
  },
  {
    key: 'ANAPEC',
    desc: 'Aides à l\'emploi, à l\'insertion et à la formation professionnelle',
    url: 'https://www.anapec.org',
  },
  {
    key: 'CRI',
    desc: 'Centres Régionaux d\'Investissement — Charte TPME et investissements régionaux',
    url: 'https://www.cri-invest.ma',
  },
  {
    key: 'ADD',
    desc: 'Agence du Développement Digital — digitalisation des PME',
    url: 'https://www.add.gov.ma',
  },
]

const TYPE_AIDE: Record<string, { label: string; cls: string }> = {
  subvention:          { label: 'Subvention',        cls: 'bg-green-100 text-green-700' },
  prime:               { label: 'Prime',              cls: 'bg-emerald-100 text-emerald-700' },
  garantie:            { label: 'Garantie',           cls: 'bg-blue-100 text-blue-700' },
  pret:                { label: 'Prêt bonifié',       cls: 'bg-orange-100 text-orange-700' },
  pret_honneur:        { label: 'Prêt d\'honneur',    cls: 'bg-yellow-100 text-yellow-700' },
  exoneration_fiscale: { label: 'Exonér. fiscale',    cls: 'bg-violet-100 text-violet-700' },
  exoneration_sociale: { label: 'Exonér. sociale',    cls: 'bg-purple-100 text-purple-700' },
  accompagnement:      { label: 'Accompagnement',     cls: 'bg-gray-100 text-gray-600' },
  participation_capital:{ label: 'Capital',           cls: 'bg-indigo-100 text-indigo-700' },
}

const CATEGORIE: Partial<Record<CategorieDispositif, string>> = {
  investissement_croissance: 'Investissement',
  digitalisation:            'Digitalisation',
  financement_garantie:      'Garantie',
  emploi_formation:          'Emploi & Formation',
  innovation:                'Innovation',
  transition_ecologique:     'Écologie',
  sectoriel_tourisme:        'Tourisme',
  diaspora:                  'MRE / Diaspora',
}

// ---- Helpers ----

function formatMontant(d: Dispositif): string {
  if (d.montant_max) {
    const v = d.montant_max
    const dev = d.devise ?? 'MAD'
    if (v >= 1_000_000) return `Jusqu'à ${v / 1_000_000} M ${dev}`
    if (v >= 1_000)     return `Jusqu'à ${Math.round(v / 1_000)} K ${dev}`
    return `Jusqu'à ${v} ${dev}`
  }
  if (d.taux) return `Jusqu'à ${d.taux}%`
  return 'Variable'
}

// ---- Page ----

export default async function CataloguePage() {
  const supabase = await createClient()

  const { data: dispositifs } = await supabase
    .from('dispositifs')
    .select('*')
    .eq('pays', 'MA')
    .order('nom')

  const items = (dispositifs ?? []) as Dispositif[]

  // Grouper par opérateur
  const byOperateur: Record<string, Dispositif[]> = {}
  for (const d of items) {
    const op = d.operateur ?? 'Autres'
    if (!byOperateur[op]) byOperateur[op] = []
    byOperateur[op].push(d)
  }

  // Opérateurs dans l'ordre défini, puis les autres
  const opKeys = [
    ...OPERATEURS_ORDRE.map((o) => o.key).filter((k) => byOperateur[k]),
    ...Object.keys(byOperateur).filter((k) => !OPERATEURS_ORDRE.find((o) => o.key === k)),
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-corail-pale text-corail-fonce text-xs font-medium px-3 py-1.5 rounded-full mb-4">
          🇲🇦 Maroc — {items.length} programmes référencés
        </div>
        <h1 className="text-3xl font-semibold text-ardoise mb-3">
          Catalogue des aides publiques marocaines
        </h1>
        <p className="text-ardoise-clair max-w-xl mx-auto text-sm leading-relaxed">
          Tous les programmes d'aide aux TPME/PME, classés par organisme. Montants et taux indicatifs — vérifiez sur le site officiel de chaque opérateur.
        </p>
        <Link href="/diagnostic"
          className="mt-6 inline-block btn-primary px-7 py-3 rounded-xl bg-corail hover:bg-corail-fonce text-white text-sm font-medium transition shadow-sm">
          Faire mon diagnostic gratuit →
        </Link>
      </div>

      {/* Sections par opérateur */}
      {opKeys.map((opKey) => {
        const opConfig = OPERATEURS_ORDRE.find((o) => o.key === opKey)
        const devs = byOperateur[opKey]

        return (
          <section key={opKey} className="mb-12">
            {/* En-tête opérateur */}
            <div className="flex items-start justify-between mb-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-ardoise">{opKey}</h2>
                {opConfig?.desc && (
                  <p className="text-xs text-ardoise-clair mt-0.5">{opConfig.desc}</p>
                )}
              </div>
              {opConfig?.url && (
                <a href={opConfig.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-corail hover:underline flex-shrink-0 mt-1">
                  {opConfig.url.replace('https://www.', '')} ↗
                </a>
              )}
            </div>

            {/* Grille dispositifs */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {devs.map((d) => {
                const typeAide = TYPE_AIDE[d.type_aide] ?? { label: d.type_aide, cls: 'bg-gray-100 text-gray-600' }
                const categLabel = d.categorie ? CATEGORIE[d.categorie as CategorieDispositif] : null

                return (
                  <div key={d.slug} className={`card flex flex-col gap-3 ${!d.actif ? 'opacity-60' : ''}`}>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeAide.cls}`}>
                        {typeAide.label}
                      </span>
                      {categLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-corail-pale text-corail-fonce">
                          {categLabel}
                        </span>
                      )}
                    </div>

                    {/* Nom */}
                    <div className="font-medium text-ardoise text-sm leading-snug">{d.nom}</div>

                    {/* Montant */}
                    <div className="text-xs text-ardoise-clair font-medium">{formatMontant(d)}</div>

                    {/* Footer : guichet + délai */}
                    <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      {d.guichet_ouvert ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                          Ouvert
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"></span>
                          Guichet fermé
                        </span>
                      )}
                      {d.delai_indicatif && (
                        <span className="text-xs text-ardoise-clair">{d.delai_indicatif}</span>
                      )}
                    </div>

                    {/* Note guichet fermé */}
                    {!d.guichet_ouvert && (
                      <p className="text-xs text-gray-400 -mt-1">
                        Prochaine édition à confirmer sur {d.lien_officiel?.replace('https://www.', '') ?? 'le site officiel'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Footer CTA */}
      <div className="card py-10 text-center mt-8">
        <h2 className="text-lg font-semibold text-ardoise mb-2">
          Quels programmes vous correspondent vraiment ?
        </h2>
        <p className="text-sm text-ardoise-clair mb-6 max-w-sm mx-auto">
          Le diagnostic analyse automatiquement votre éligibilité sur critères officiels — en moins de 5 minutes.
        </p>
        <Link href="/diagnostic"
          className="btn-primary px-8 py-3 rounded-xl bg-corail hover:bg-corail-fonce text-white text-sm font-medium transition inline-block">
          Commencer mon diagnostic →
        </Link>
      </div>
    </div>
  )
}
