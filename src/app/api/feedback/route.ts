import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, message, contact_email, screen } = body

  if (!type || !message) {
    return NextResponse.json({ error: 'type and message are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('feedback').insert({
    user_id: user?.id ?? null,
    type,
    message,
    contact_email: contact_email ?? null,
    screen: screen ?? 'other',
    user_agent: req.headers.get('user-agent'),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
