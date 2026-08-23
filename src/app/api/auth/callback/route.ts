import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/tableau-de-bord'

  if (code) {
    console.log('[callback] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30))
    console.log('[callback] ANON_KEY set:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[callback] exchangeCodeForSession error:', error?.message ?? 'none')
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/connexion?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}/connexion?error=no_code`)
}
