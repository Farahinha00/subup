import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Client anonyme sans cookie — pour les données publiques cachées (dispositifs)
// Lazy pour éviter l'évaluation au build (env vars absentes pendant next build)
let _client: SupabaseClient | null = null

export function getSupabasePublic(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}
