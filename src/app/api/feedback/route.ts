import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug ou blocage',
  missing_info: 'Information manquante',
  idea: "Idée d'amélioration",
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, message, contact_email, screen } = body

  if (!type || !message) {
    return NextResponse.json({ error: 'type and message are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sauvegarde Supabase
  await supabase.from('feedback').insert({
    user_id: user?.id ?? null,
    type,
    message,
    contact_email: contact_email ?? null,
    screen: screen ?? 'other',
    user_agent: req.headers.get('user-agent'),
  })

  // Envoi email si RESEND_API_KEY configuré
  const resendKey = process.env.RESEND_API_KEY
  const recipient = process.env.FEEDBACK_RECIPIENT_EMAIL
  if (resendKey && recipient) {
    const resend = new Resend(resendKey)
    const typeLabel = TYPE_LABELS[type] ?? type

    await resend.emails.send({
      from: 'Fondouk Feedback <onboarding@resend.dev>',
      to: recipient,
      subject: `[Fondouk – ${typeLabel}] ${screen ?? ''}`,
      text: [
        `Type     : ${typeLabel}`,
        `Page     : ${screen ?? '—'}`,
        user?.email    ? `Compte   : ${user.email}` : '',
        contact_email  ? `Contact  : ${contact_email}` : '',
        '',
        '─────────────────────────────',
        message,
      ].filter(Boolean).join('\n'),
    })
  }

  return NextResponse.json({ ok: true })
}
