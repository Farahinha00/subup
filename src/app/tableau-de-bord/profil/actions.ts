'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function mettreAJourProfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  await supabase.from('profiles').update({
    prenom: formData.get('prenom') as string || null,
    nom: formData.get('nom') as string || null,
    entreprise: formData.get('entreprise') as string || null,
    telephone: formData.get('telephone') as string || null,
    ville: formData.get('ville') as string || null,
  }).eq('id', user.id)

  revalidatePath('/tableau-de-bord/profil')
}
