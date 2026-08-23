import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LABELS } from '@/lib/labels'
import type { Dispositif, Critere } from '@/types'

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '22', color }}>
      {label}
    </span>
  )
}

export default async function CataloguePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: dispositifs } = await supabase
    .from('dispositifs')
    .select('*')
    .eq('actif', true)
    .eq('pays', 'MA')
    .order('nom')

  const list = (dispositifs ?? []) as Dispositif[]

  return (
    <div className="px-8 py-8 w-full">
      <div className="mb-6">
        <h1 className="font-grotesk font-bold text-[22px] text-ardoise">🇲🇦 Catalogue des dispositifs</h1>
        <p className="text-[13px] text-ardoise-clair mt-1">{list.length} dispositifs actifs</p>
      </div>

      <div className="flex flex-col gap-3">
        {list.map((d) => {
              const criteres: Critere[] = Array.isArray(d.regles?.criteres) ? d.regles.criteres : []
              const montant = d.montant_max
                ? d.montant_max >= 1_000_000
                  ? `${(d.montant_max / 1_000_000).toFixed(0)} M ${d.devise}`
                  : `${Math.round(d.montant_max / 1_000)} K ${d.devise}`
                : d.taux ? `${d.taux}%` : '—'

              return (
                <details
                  key={d.id}
                  className="rounded-[14px] overflow-hidden"
                  style={{ border: '1px solid var(--pierre)', backgroundColor: 'white' }}
                >
                  <summary
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none list-none"
                    style={{ outline: 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-grotesk font-semibold text-[14px] text-ardoise">{d.nom}</span>
                        {d.categorie && (
                          <Badge
                            label={LABELS.categorie_dispositif?.[d.categorie] ?? d.categorie}
                            color="#1F5A44"
                          />
                        )}
                        <Badge
                          label={LABELS.type_aide?.[d.type_aide] ?? d.type_aide}
                          color="#8A8378"
                        />
                      </div>
                      <div className="text-[12px] text-ardoise-clair mt-0.5">{d.organisme}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-grotesk font-bold text-[15px] text-ardoise">{montant}</div>
                      <div className="text-[11px] text-ardoise-clair">{criteres.length} critère{criteres.length > 1 ? 's' : ''}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: '#8A8378' }}>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </summary>

                  {criteres.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--pierre)', padding: '16px 20px' }}>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-ardoise-clair mb-3">Critères d&apos;éligibilité</div>
                      <div className="flex flex-col gap-2">
                        {criteres.map((c) => (
                          <div key={c.id} className="flex items-start gap-2">
                            <span
                              className="text-[11px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                              style={{
                                backgroundColor: c.bloquant ? '#FFF0EE' : '#F1EEE9',
                                color: c.bloquant ? '#E2703A' : '#8A8378',
                              }}
                            >
                              {c.bloquant ? 'Bloquant' : 'Critère'}
                            </span>
                            <span className="text-[13px] text-ardoise leading-snug">{c.label}</span>
                          </div>
                        ))}
                      </div>
                      {d.lien_officiel && (
                        <a
                          href={d.lien_officiel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-4 text-[12px] font-semibold"
                          style={{ color: 'var(--corail)' }}
                        >
                          Lien officiel →
                        </a>
                      )}
                    </div>
                  )}
                </details>
              )
            })}
      </div>
    </div>
  )
}
