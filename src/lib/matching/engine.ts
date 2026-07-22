import type { CategorieDispositif, Critere, Dispositif, Reponses, CritereResultat, StatutResultat } from '@/types'
import {
  TRANCHES_MAD, TRANCHES_EFFECTIF, TRANCHES_EFFECTIF_FR, TRANCHES_EUR_CA, TRANCHES_EUR_BUDGET,
  REGIONS_PRIME_TERRITORIALE_PARTIELLE,
} from '@/lib/labels'

// Catégories toujours évaluées (pas de question de filtre associée)
const CATEGORIES_TOUJOURS = new Set<CategorieDispositif>([
  'creation_reprise',
  'innovation_rd',
  'fiscal_social',
  'financement_innovation',
])

// Retourne true si le dispositif doit être évalué compte tenu des réponses
function categorieActive(categorie: CategorieDispositif | null, reponses: Reponses): boolean {
  if (!categorie) return true // dispositif sans catégorie (MA) : toujours évalué
  if (CATEGORIES_TOUJOURS.has(categorie)) return true

  // Pour les anciennes réponses sans ces champs : undefined → inclure (backward compat)
  switch (categorie) {
    case 'digitalisation':
      return reponses.dimension_numerique !== false
    case 'embauche_formation':
      return reponses.embauche_prevue !== 'non'
    case 'transition_ecologique':
      return reponses.dimension_ecologique !== false
    case 'export':
      return reponses.dimension_export !== false
    default:
      return true
  }
}

// Enrichit les réponses avec les champs calculés (adapté au pays)
function enrichirReponses(reponses: Reponses): Record<string, unknown> {
  const r = { ...reponses } as Record<string, unknown>

  if (reponses.pays === 'FR') {
    if (reponses.ca_annuel) r.ca_annuel = TRANCHES_EUR_CA[reponses.ca_annuel] ?? 0
    if (reponses.budget_projet) r.budget_projet = TRANCHES_EUR_BUDGET[reponses.budget_projet] ?? 0
    if (reponses.effectif) r.effectif = reponses.effectif
  } else {
    if (reponses.ca_annuel) r.ca_annuel = TRANCHES_MAD[reponses.ca_annuel] ?? 0
    if (reponses.montant_projet) r.montant_projet = TRANCHES_MAD[reponses.montant_projet] ?? 0
    if (reponses.emplois_prevus) r.emplois_prevus_num = TRANCHES_EFFECTIF[reponses.emplois_prevus] ?? 0
    if (reponses.region) {
      r.province_eligible_territoriale = !REGIONS_PRIME_TERRITORIALE_PARTIELLE.includes(reponses.region)
    }
  }

  return r
}

function evaluerCritere(
  critere: Critere,
  reponses: Record<string, unknown>
): 'ok' | 'manquant' | 'bloquant' {
  const valeur = reponses[critere.champ]

  if (valeur === undefined || valeur === null) {
    return critere.bloquant ? 'bloquant' : 'manquant'
  }

  let ok = false

  switch (critere.type) {
    case 'boolean':
      ok = valeur === critere.valeur
      break

    case 'enum_includes':
      ok = Array.isArray(critere.valeurs) && critere.valeurs.includes(String(valeur))
      break

    case 'enum_excludes':
      ok = Array.isArray(critere.valeurs) && !critere.valeurs.includes(String(valeur))
      break

    case 'range': {
      const num = Number(valeur)
      const minOk = critere.min == null || num >= Number(critere.min)
      const maxOk = critere.max == null || num <= Number(critere.max)
      ok = minOk && maxOk
      break
    }

    case 'min_value':
      ok = Number(valeur) >= Number(critere.valeur)
      break
  }

  if (ok) return 'ok'
  return critere.bloquant ? 'bloquant' : 'manquant'
}

export interface ResultatMatching {
  dispositif_id: string
  score: number
  statut: StatutResultat
  criteres_ok: CritereResultat[]
  criteres_manquants: CritereResultat[]
  criteres_bloquants: CritereResultat[]
}

export function matcherDispositif(dispositif: Dispositif, reponses: Reponses): ResultatMatching {
  const enrichies = enrichirReponses(reponses)
  const criteres = dispositif.regles.criteres

  const ok: CritereResultat[] = []
  const manquants: CritereResultat[] = []
  const bloquants: CritereResultat[] = []

  for (const critere of criteres) {
    const statut = evaluerCritere(critere, enrichies)
    const item: CritereResultat = { id: critere.id, label: critere.label, message_echec: critere.message_echec }

    if (statut === 'ok') ok.push(item)
    else if (statut === 'bloquant') bloquants.push(item)
    else manquants.push(item)
  }

  const aBloquant = bloquants.length > 0
  const score = aBloquant ? 0 : Math.round((ok.length / criteres.length) * 100)

  let statut: StatutResultat
  if (aBloquant) statut = 'non_eligible'
  else if (score === 100) statut = 'eligible'
  else if (score >= 60) statut = 'probable'
  else statut = 'non_eligible'

  return {
    dispositif_id: dispositif.id,
    score,
    statut,
    criteres_ok: ok,
    criteres_manquants: manquants,
    criteres_bloquants: bloquants,
  }
}

export function matcherTousDispositifs(
  dispositifs: Dispositif[],
  reponses: Reponses
): ResultatMatching[] {
  return dispositifs
    .filter((d) => d.actif && categorieActive(d.categorie, reponses))
    .map((d) => matcherDispositif(d, reponses))
    .sort((a, b) => b.score - a.score)
}
