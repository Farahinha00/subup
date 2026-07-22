import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ titre: null }, { status: 200 })
  }

  const { description_projet, reponses } = await req.json()

  const contexte = [
    description_projet ? `Description : ${description_projet}` : null,
    reponses?.secteur ? `Secteur : ${reponses.secteur}` : null,
    reponses?.pays ? `Pays : ${reponses.pays}` : null,
    reponses?.type_projet ? `Type de projet : ${reponses.type_projet}` : null,
    reponses?.statut_juridique ? `Statut : ${reponses.statut_juridique}` : null,
  ].filter(Boolean).join('\n')

  if (!contexte) {
    return NextResponse.json({ titre: null })
  }

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `Génère un titre court (5 à 7 mots max) pour ce diagnostic de financement d'entreprise. Réponds UNIQUEMENT avec le titre, sans guillemets, sans ponctuation finale.\n\n${contexte}`,
      }],
    })
    const titre = (msg.content[0] as { type: string; text: string }).text.trim()
    return NextResponse.json({ titre })
  } catch {
    return NextResponse.json({ titre: null })
  }
}
