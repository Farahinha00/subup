import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mettreAJourProfil } from './actions'

function Field({ label, name, defaultValue, type = 'text' }: { label: string; name: string; defaultValue?: string | null; type?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-ardoise-clair mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        className="w-full px-4 py-2.5 rounded-[10px] text-[14px] text-ardoise outline-none transition-colors"
        style={{ border: '1px solid var(--pierre)', backgroundColor: 'white' }}
      />
    </div>
  )
}

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const ini = (() => {
    const p = profile?.prenom, n = profile?.nom
    if (p && n) return (p[0] + n[0]).toUpperCase()
    if (p) return p.slice(0, 2).toUpperCase()
    return (user.email ?? 'U').slice(0, 2).toUpperCase()
  })()

  return (
    <div className="px-8 py-8 w-full max-w-xl">
      <h1 className="font-grotesk font-bold text-[22px] text-ardoise mb-6">Mon profil</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-grotesk font-bold text-[20px] flex-shrink-0"
          style={{ backgroundColor: 'var(--vert)', color: 'var(--fond)' }}
        >
          {ini}
        </div>
        <div>
          <div className="font-grotesk font-semibold text-[15px] text-ardoise">
            {profile?.prenom && profile?.nom ? `${profile.prenom} ${profile.nom}` : user.email}
          </div>
          <div className="text-[13px] text-ardoise-clair">{user.email}</div>
        </div>
      </div>

      {/* Formulaire */}
      <form action={mettreAJourProfil} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prénom" name="prenom" defaultValue={profile?.prenom} />
          <Field label="Nom" name="nom" defaultValue={profile?.nom} />
        </div>
        <Field label="Entreprise" name="entreprise" defaultValue={profile?.entreprise} />
        <Field label="Téléphone" name="telephone" defaultValue={profile?.telephone} type="tel" />
        <Field label="Ville" name="ville" defaultValue={profile?.ville} />

        <div className="pt-2">
          <button
            type="submit"
            className="btn-primary px-6 py-2.5 text-[13px]"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
