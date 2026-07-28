import { createClient } from '@supabase/supabase-js'

// Client anonyme sans cookie — pour les données publiques cachées (dispositifs)
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
