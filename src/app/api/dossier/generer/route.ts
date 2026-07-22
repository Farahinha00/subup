import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import PDFDocument from 'pdfkit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface ValidationRegleRow { regle: string; config: Record<string, unknown> }

function checkValidations(
  validations: ValidationRegleRow[],
  donnees: Record<string, unknown>
): { ok: false; alerte: string } | { ok: true } {
  for (const v of validations) {
    if (v.regle === 'coherence_montants') {
      const champ = v.config.champ as string
      const max = v.config.max as number
      const val = Number(donnees[champ] ?? 0)
      if (val > 0 && val > max) {
        const alerte = (v.config.alerte as string ?? `Validation échouée : ${champ} = ${val} > ${max}`)
          .replace('{valeur}', String(val))
        return { ok: false, alerte }
      }
    }
  }
  return { ok: true }
}

function buildContextBloc(
  champs: Array<{ id: string; source: string }>,
  donnees: Record<string, unknown>,
  docId: string
): string {
  const lines: string[] = []
  const seen = new Set<string>()
  for (const c of champs) {
    const val = donnees[c.source] ?? donnees[c.id] ?? '(non renseigné)'
    lines.push(`${c.id}: ${val}`)
    seen.add(c.id)
  }
  for (const [k, v] of Object.entries(donnees)) {
    if (k.startsWith(`__ctx_${docId}_`)) {
      const label = k.replace(`__ctx_${docId}_`, '')
      if (!seen.has(label)) lines.push(`${label}: ${v}`)
    }
  }
  return lines.join('\n')
}

async function textToPdf(content: string, titre: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks).toString('base64')))
    doc.on('error', reject)

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#1F5A44').text(titre)
    doc.moveDown(0.4)
    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor('#C0DAC9').stroke()
    doc.moveDown(0.8)
    doc.fillColor('#221F1D')

    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) {
        doc.moveDown(0.35)
        continue
      }
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        const heading = trimmed.startsWith('## ') ? trimmed.slice(3) : trimmed.slice(2)
        doc.moveDown(0.4)
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#1F5A44').text(heading)
        doc.fillColor('#221F1D').moveDown(0.2)
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#221F1D').text(trimmed.slice(2, -2))
        doc.moveDown(0.15)
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        doc.font('Helvetica').fontSize(11).text(`• ${trimmed.slice(2)}`, { indent: 16 })
        doc.moveDown(0.1)
      } else {
        doc.font('Helvetica').fontSize(11).text(trimmed)
        doc.moveDown(0.15)
      }
    }

    doc.end()
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { dossierId } = await req.json() as { dossierId: string }

  const { data: dossier } = await supabase
    .from('dossiers_generes')
    .select('*, dispositif:dispositifs(*)')
    .eq('id', dossierId)
    .eq('user_id', user.id)
    .single()

  if (!dossier) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const schema = dossier.dispositif?.documents_requis_generation
  const donnees = (dossier.donnees_completes ?? {}) as Record<string, unknown>
  const generated: Record<string, string> = {}

  await supabase.from('dossiers_generes').update({ statut: 'generation_en_cours' }).eq('id', dossierId)

  if (schema?.documents_a_generer?.length) {
    for (const doc of schema.documents_a_generer) {
      const docMode = String(donnees[`__mode_${doc.id}`] ?? doc.mode ?? 'generer')

      if (docMode === 'upload') continue

      const validation = checkValidations(doc.validations ?? [], donnees)
      if (!validation.ok) {
        await supabase.from('dossiers_generes').update({ statut: 'erreur' }).eq('id', dossierId)
        return NextResponse.json(
          { error: 'validation_failed', alerte: validation.alerte, doc_id: doc.id },
          { status: 422 }
        )
      }

      const context = buildContextBloc(doc.champs_requis ?? [], donnees, doc.id)

      const prompt = `Tu es un expert en financement d'entreprise et rédaction de documents professionnels au Maroc.

Génère un "${doc.label}" en français, document qui sera utilisé dans un dossier de demande de ${dossier.dispositif.nom} (${dossier.dispositif.organisme}).

Données de l'entreprise et contexte fourni :
${context}

Instructions :
- Rédige un vrai document opérationnel qui aide le porteur de projet — pas un résumé administratif
- Structure avec des sections claires (## Titre de section)
- Longueur : 400 à 700 mots (1 à 2 pages)
- Ton professionnel, direct, adapté à une demande officielle marocaine
- Intègre toutes les données fournies naturellement dans le texte
- Si une information manque, écris [À compléter : description] à l'endroit concerné
- Commence directement par le contenu (pas d'"introduction" méta)

Génère uniquement le contenu du document.`

      try {
        const resp = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        })
        const text = resp.content[0].type === 'text' ? resp.content[0].text : ''
        generated[doc.id] = await textToPdf(text, doc.label)
      } catch (e) {
        console.error('Génération doc erreur:', e)
        generated[doc.id] = await textToPdf('[Erreur de génération — veuillez réessayer]', doc.label)
      }

      await supabase.from('documents_generes').insert({
        dossier_id: dossierId,
        type_document: doc.type_document,
        label: doc.label,
        fichier_url: null,
        format: 'pdf',
        version: 1,
        statut: 'genere',
      })
    }
  }

  await supabase.from('dossiers_generes').update({
    statut: 'pret',
    donnees_completes: { ...donnees, _generated_ids: Object.keys(generated) },
  }).eq('id', dossierId)

  return NextResponse.json({ ok: true, generated })
}
