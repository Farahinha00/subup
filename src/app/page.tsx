import Link from 'next/link'
import { getPaysActifs } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'

const steps = [
  { n: '01', title: 'Décrivez votre projet', desc: 'Secteur, taille, région — décrivez en quelques mots ou répondez aux questions guidées.' },
  { n: '02', title: 'Recevez vos matchs', desc: 'Sub\'up croise votre profil avec les dispositifs actifs et calcule votre éligibilité réelle.' },
  { n: '03', title: 'Montez le dossier', desc: 'Documents à préparer, organismes à contacter, étapes pour déposer votre dossier.' },
]

const audiences = [
  { title: 'TPE & indépendants', desc: 'Trouvez les aides de démarrage et d\'investissement sans passer par un consultant.', bg: 'bg-vert-pale', dot: 'bg-vert' },
  { title: 'PME en croissance', desc: 'Fonds régionaux, cofinancement export, subventions à l\'innovation.', bg: 'bg-corail-pale', dot: 'bg-corail' },
  { title: 'Experts-comptables', desc: 'Gérez l\'éligibilité de tout votre portefeuille clients depuis un seul tableau de bord.', bg: 'bg-pierre-clair', dot: 'bg-ardoise-clair' },
]

export default async function LandingPage() {
  const paysActifs = await getPaysActifs()
  const multiPays = paysActifs.length > 1
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const { count: nbDispositifs } = await supabase
    .from('dispositifs')
    .select('*', { count: 'exact', head: true })
    .eq('actif', true)
  const nbLabel = nbDispositifs ? `${nbDispositifs}+` : '…'

  return (
    <div className="bg-fond">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">

        {/* Texte */}
        <div>
          <div className="inline-flex items-center gap-2 bg-vert-pale text-vert text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-vert inline-block" />
            {nbLabel} dispositifs référencés
          </div>

          <h1 className="font-grotesk font-bold text-ardoise leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: 'clamp(36px, 4.2vw, 56px)' }}>
            La bonne subvention,<br />trouvée en quelques minutes.
          </h1>

          <p className="text-[17px] leading-relaxed text-ardoise-moyen max-w-lg mb-9">
            {multiPays
              ? 'Sub\'up analyse le profil de votre entreprise et vous connecte aux aides publiques marocaines et françaises auxquelles vous êtes réellement éligible.'
              : 'Sub\'up analyse le profil de votre entreprise et vous connecte aux aides publiques auxquelles vous êtes réellement éligible — sans jargon, sans consultant.'}
          </p>

          {multiPays ? (
            <div className="grid sm:grid-cols-2 gap-3 max-w-sm mb-8">
              <Link href="/diagnostic?pays=MA" className="btn-primary py-3.5 text-center rounded-[10px]">
                🇲🇦 Maroc
              </Link>
              <Link href="/diagnostic?pays=FR" className="btn-secondary py-3.5 text-center rounded-[10px]">
                🇫🇷 France
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <Link href="/diagnostic"
                className="btn-primary py-4 px-7 text-base rounded-[10px] inline-block">
                Vérifier mon éligibilité →
              </Link>
              <Link href="/catalogue" className="text-[15px] font-semibold text-ardoise hover:text-vert transition flex items-center gap-1.5">
                Voir les dispositifs →
              </Link>
            </div>
          )}

          <div className="flex gap-9">
            {[{ value: nbLabel, label: 'dispositifs' }, { value: '3 200', label: 'entreprises' }, { value: '840M MAD', label: 'financés' }].map((s) => (
              <div key={s.label}>
                <div className="font-grotesk font-bold text-[24px] text-ardoise">{s.value}</div>
                <div className="text-[12px] text-ardoise-clair mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div className="hidden lg:block bg-vert rounded-[22px] p-8 relative overflow-hidden">
          <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-vert-clair" />

          {[
            { name: 'Intelaka — Fonds régional', detail: "Jusqu'à 1,2M MAD · Taux 0%", match: '92%', matchColor: 'bg-vert-pale text-vert', barColor: 'bg-vert', barW: '92%' },
            { name: 'Tatwir Croissance', detail: "Jusqu'à 20M MAD · Cofinancement", match: '76%', matchColor: 'bg-corail-pale text-corail-fonce', barColor: 'bg-corail', barW: '76%' },
          ].map((m) => (
            <div key={m.name} className="relative bg-fond rounded-2xl p-5 mb-3 last:mb-0">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-grotesk font-bold text-[15px] text-ardoise">{m.name}</div>
                  <div className="text-[12px] text-ardoise-clair mt-0.5">{m.detail}</div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${m.matchColor}`}>
                  {m.match} match
                </span>
              </div>
              <div className="h-1.5 bg-pierre-clair rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${m.barColor}`} style={{ width: m.barW }} />
              </div>
            </div>
          ))}

          <div className="relative border rounded-2xl p-4 text-center text-[12px] mt-3" style={{ backgroundColor: 'rgba(250,248,245,0.1)', borderColor: 'rgba(250,248,245,0.25)', color: 'var(--vert-pale)' }}>
            + {nbDispositifs ? nbDispositifs - 2 : '…'} autres dispositifs analysés pour votre profil
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────────────────────── */}
      <section className="bg-white border-y border-pierre">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-lg mx-auto text-center mb-14">
            <h2 className="font-grotesk font-bold text-[32px] text-ardoise tracking-tight mb-3">
              Trois étapes, un dossier complet
            </h2>
            <p className="text-ardoise-clair text-[15px]">De l&apos;analyse à la soumission, sans jargon administratif.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="card rounded-[18px]">
                <div className="font-grotesk font-bold text-[13px] text-corail mb-5">{s.n}</div>
                <div className="font-grotesk font-bold text-[18px] text-ardoise mb-3">{s.title}</div>
                <p className="text-[13.5px] leading-relaxed text-ardoise-clair">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUDIENCES ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-lg mx-auto text-center mb-14">
          <h2 className="font-grotesk font-bold text-[32px] text-ardoise tracking-tight mb-3">
            Pensé pour chaque profil
          </h2>
          <p className="text-ardoise-clair text-[15px]">Que vous gériez une seule entreprise ou un portefeuille de clients.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {audiences.map((a) => (
            <div key={a.title} className="card rounded-[18px] flex flex-col gap-4">
              <div className={`w-11 h-11 rounded-[12px] ${a.bg} flex items-center justify-center`}>
                <div className={`w-4 h-4 rounded-[5px] ${a.dot}`} />
              </div>
              <div className="font-grotesk font-bold text-[17px] text-ardoise">{a.title}</div>
              <p className="text-[13.5px] leading-relaxed text-ardoise-clair">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-vert rounded-[28px] px-10 py-16 text-center relative overflow-hidden">
          <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-vert-clair" />
          <div className="absolute -top-12 right-8 w-36 h-36 rounded-full bg-corail opacity-40" />
          <div className="relative">
            <h2 className="font-grotesk font-bold text-fond tracking-tight mb-4"
                style={{ fontSize: 'clamp(26px, 3.2vw, 38px)' }}>
              Prêt à financer votre prochaine étape ?
            </h2>
            <p className="text-vert-pale text-[15px] mb-8">
              Gratuit pour vérifier votre éligibilité. Aucune carte bancaire requise.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/diagnostic"
                className="font-grotesk font-semibold text-[15px] bg-fond text-vert hover:bg-pierre transition px-7 py-3.5 rounded-[10px] inline-block">
                Commencer gratuitement
              </Link>
              {!isLoggedIn && (
                <Link href="/connexion" className="text-[14px] font-medium text-vert-pale hover:text-fond transition">
                  J&apos;ai déjà un compte →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
