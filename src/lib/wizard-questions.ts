import type { Reponses } from '@/types'
import { LABELS } from '@/lib/labels'

// ── Types extraction ──────────────────────────────────────────────────────────

export type ConfidenceLevel = 'certain' | 'inferred' | 'missing'

export interface FieldExtraction {
  value: unknown
  confidence: ConfidenceLevel
}

export type ExtractionOutput = Record<string, FieldExtraction>

// ── Types config questions ────────────────────────────────────────────────────

interface BaseQ {
  champ: keyof Reponses
  extractionLabel: string
  extractionHint?: string
  questionLabel: string
  hint?: string
  showCondition?: (r: Partial<Reponses>) => boolean
}

export interface EnumQ extends BaseQ {
  type: 'enum'
  options: readonly string[]
  cols?: 1 | 2
}

export interface BooleanQ extends BaseQ {
  type: 'boolean'
  labelOui: string
  labelNon: string
}

export interface YearQ extends BaseQ {
  type: 'year'
}

export type WizardQ = EnumQ | BooleanQ | YearQ

// ── Config complète des questions MA ─────────────────────────────────────────

export const WIZARD_QUESTIONS_MA: WizardQ[] = [
  // — Étape 1 —
  {
    champ: 'statut_juridique',
    type: 'enum',
    options: ['SARL', 'SA', 'auto-entrepreneur', 'pas encore créée'],
    extractionLabel: 'Forme juridique de l\'entreprise',
    extractionHint: 'SARL, SA, auto-entrepreneur, ou projet pas encore immatriculé',
    questionLabel: '1. Statut juridique',
    cols: 1,
  },
  {
    champ: 'annee_creation',
    type: 'year',
    extractionLabel: 'Année de création de l\'entreprise (ou prévue)',
    extractionHint: 'Année entière entre 1950 et 2030',
    questionLabel: '2. Année de création',
  },
  {
    champ: 'secteur',
    type: 'enum',
    options: ['industrie', 'services', 'TIC', 'agro', 'artisanat', 'tourisme', 'sport_loisirs', 'economie_verte', 'alcool_tabac', 'immobilier_residentiel', 'autre'],
    extractionLabel: 'Secteur d\'activité principal',
    extractionHint: 'industrie=manufacturing/transformation, TIC=tech/logiciel, agro=agroalimentaire, sport_loisirs=salle de sport/loisirs/bien-être, economie_verte=énergie renouvelable/environnement',
    questionLabel: '3. Secteur d\'activité',
    cols: 2,
  },
  {
    champ: 'region',
    type: 'enum',
    options: ['Tanger-Tétouan-Al Hoceima', 'Oriental', 'Fès-Meknès', 'Rabat-Salé-Kénitra', 'Béni Mellal-Khénifra', 'Casablanca-Settat', 'Marrakech-Safi', 'Drâa-Tafilalet', 'Souss-Massa', 'Guelmim-Oued Noun', 'Laâyoune-Sakia El Hamra', 'Dakhla-Oued Ed-Dahab'],
    extractionLabel: 'Région du Maroc où se situe (ou se situera) le projet',
    extractionHint: 'Casablanca → Casablanca-Settat, Rabat → Rabat-Salé-Kénitra, Marrakech → Marrakech-Safi, Agadir → Souss-Massa, Fès → Fès-Meknès, Tanger → Tanger-Tétouan-Al Hoceima',
    questionLabel: '4. Région d\'implantation',
    cols: 1,
  },
  {
    champ: 'effectif',
    type: 'enum',
    options: ['0', '1-5', '6-20', '20+'],
    extractionLabel: 'Effectif salarié actuel',
    extractionHint: '0=fondateurs seuls sans salarié, "20+" si plus de 20 salariés',
    questionLabel: '5. Effectif actuel',
    cols: 1,
  },
  {
    champ: 'ca_annuel',
    type: 'enum',
    options: ['<100K', '100K-1M', '1M-10M', '10M-50M', '>50M'],
    extractionLabel: 'Chiffre d\'affaires annuel en MAD',
    extractionHint: '"500 000 MAD" → 100K-1M, "3 millions" → 1M-10M, startup ou pas encore de CA → <100K, "200 millions" → 10M-50M',
    questionLabel: '6. Chiffre d\'affaires annuel',
    cols: 1,
  },
  {
    champ: 'porteur_mre',
    type: 'boolean',
    extractionLabel: 'Le porteur du projet est un Marocain Résidant à l\'Étranger (MRE)',
    extractionHint: 'MRE, Marocain de la diaspora, réside en Europe ou à l\'étranger',
    questionLabel: '7. Êtes-vous Marocain Résidant à l\'Étranger (MRE) ?',
    hint: 'Détermine l\'accès aux programmes MRE (MDM Invest…).',
    labelOui: 'Oui, je réside à l\'étranger',
    labelNon: 'Non, je réside au Maroc',
  },

  // — Étape 2 —
  {
    champ: 'type_projet',
    type: 'enum',
    options: ['creation', 'extension', 'digitalisation', 'innovation', 'export'],
    extractionLabel: 'Nature du projet',
    extractionHint: 'creation=nouvelle entreprise ou nouveau site, extension=développement/rénovation d\'une entreprise existante, digitalisation=transformation numérique, innovation=R&D/brevet, export=développement international',
    questionLabel: '8. Type de projet',
    cols: 1,
  },
  {
    champ: 'dimension_ecologique_ma',
    type: 'boolean',
    extractionLabel: 'Le projet a une composante environnementale (efficacité énergétique, décarbonation, technologies propres)',
    extractionHint: 'Panneaux solaires, réduction CO2, économie circulaire, technologies vertes, efficacité énergétique',
    questionLabel: '↳ Dimension environnementale du projet',
    hint: 'Détermine l\'accès à TATWIR Croissance Verte.',
    labelOui: 'Oui — efficacité énergétique, décarbonation, technologies propres',
    labelNon: 'Non, pas de composante écologique',
    showCondition: (r) => r.secteur === 'industrie' || r.secteur === 'economie_verte',
  },
  {
    champ: 'ehtc_classe',
    type: 'boolean',
    extractionLabel: 'L\'établissement hôtelier est classé EHTC (hôtel, riad, maison d\'hôtes avec classification officielle)',
    extractionHint: 'Étoiles attribuées par le Ministère du Tourisme, riad classé, maison d\'hôtes avec agrément officiel',
    questionLabel: '↳ Votre établissement est-il classé EHTC ?',
    hint: 'Requis pour CAP HOSPITALITY (rénovation EHTC).',
    labelOui: 'Oui — hôtel, riad ou maison d\'hôtes avec classification officielle',
    labelNon: 'Non, pas encore classé',
    showCondition: (r) => r.secteur === 'tourisme',
  },
  {
    champ: 'montant_projet',
    type: 'enum',
    options: ['<100K', '100K-1M', '1M-10M', '10M-50M', '>50M'],
    extractionLabel: 'Montant total estimé du projet (MAD)',
    extractionHint: 'Montant global d\'investissement, travaux inclus — "2 millions de dirhams" → 1M-10M',
    questionLabel: '9. Montant estimé du projet',
    cols: 1,
  },
  {
    champ: 'autofinancement_ok',
    type: 'boolean',
    extractionLabel: 'L\'entreprise peut apporter ≥ 10% du montant en fonds propres',
    extractionHint: '"j\'ai 20% d\'apport" → true, "je n\'ai pas d\'apport" ou "financement à 100% par prêt" → false',
    questionLabel: '10. Autofinancement ≥ 10% possible ?',
    hint: 'Requis pour la Charte TPME (10% minimum en fonds propres).',
    labelOui: 'Oui, je peux',
    labelNon: 'Non / je ne sais pas',
  },
  {
    champ: 'emplois_prevus',
    type: 'enum',
    options: ['0', '1-5', '6-20', '20+'],
    extractionLabel: 'Nombre de CDI permanents créés par le projet',
    extractionHint: 'CDI permanents uniquement, pas les stages ni CDD — "5 emplois" → 1-5',
    questionLabel: '11. Emplois permanents (CDI) créés',
    cols: 1,
  },
  {
    champ: 'embauche_prevue_ma',
    type: 'enum',
    options: ['non', 'cdi_juniors', 'cdi_experimentes', 'les_deux'],
    extractionLabel: 'Profil des embauches CDI prévues dans les 12 mois',
    extractionHint: 'cdi_juniors=jeunes diplômés Bac+2 minimum inscrits à l\'ANAPEC, cdi_experimentes=profils expérimentés, les_deux=les deux catégories',
    questionLabel: '12. Profil des embauches prévues',
    hint: 'Détermine l\'accès aux aides ANAPEC (TAHFIZ, IDMAJ, TAEHIL, AWRASH 2).',
    cols: 1,
    showCondition: (r) => !!r.emplois_prevus && r.emplois_prevus !== '0',
  },

  // — Étape 3 —
  {
    champ: 'situation_administrative',
    type: 'enum',
    options: ['oui', 'non', 'en_cours'],
    extractionLabel: 'Situation fiscale et CNSS de l\'entreprise (DGI + CNSS)',
    extractionHint: 'oui=à jour de ses obligations, non=pas à jour, en_cours=régularisation en cours',
    questionLabel: '13. Situation fiscale et CNSS',
    hint: 'Une attestation DGI et CNSS est requise pour la plupart des dossiers.',
    cols: 1,
  },
  {
    champ: 'aide_anterieure',
    type: 'boolean',
    extractionLabel: 'L\'entreprise a déjà bénéficié d\'une aide publique marocaine',
    extractionHint: 'Subvention, prime, garantie déjà obtenue auprès d\'un organisme public marocain (Maroc PME, Tamwilcom, CRI, etc.)',
    questionLabel: '14. Avez-vous déjà bénéficié d\'une aide publique ?',
    labelOui: 'Oui, déjà bénéficié',
    labelNon: 'Non, première fois',
  },
  {
    champ: 'capital_independant',
    type: 'boolean',
    extractionLabel: 'Capital majoritairement indépendant (pas de grand groupe CA > 200M MAD détenant > 25%)',
    extractionHint: 'Capital détenu majoritairement par des personnes physiques privées, pas filiale d\'un grand groupe',
    questionLabel: '15. Indépendance capitalistique',
    hint: 'La Charte TPME exige qu\'aucun grand groupe (CA > 200 M MAD) ne détienne plus de 25% du capital.',
    labelOui: 'Oui, entreprise indépendante',
    labelNon: 'Non, filiale d\'un groupe (CA > 200 M MAD)',
  },
  {
    champ: 'pret_bancaire_ma',
    type: 'boolean',
    extractionLabel: 'Le projet inclut un financement bancaire (prêt en cours ou prévu)',
    extractionHint: 'Dossier de crédit bancaire déposé ou prévu, financement mixte fonds propres + banque',
    questionLabel: '16. Négociez-vous un prêt bancaire pour ce projet ?',
    hint: 'Détermine l\'accès aux garanties Tamwilcom (INTELAKA, Damane Express…).',
    labelOui: 'Oui, démarche en cours avec ma banque',
    labelNon: 'Non, pas de financement bancaire prévu',
  },
  {
    champ: 'besoin_conseil_at',
    type: 'boolean',
    extractionLabel: 'Besoin d\'accompagnement ou d\'expertise externe (consultant, cabinet, assistance technique)',
    extractionHint: 'Plan de mise à niveau, assistance technique, recours à un prestataire ou consultant externe',
    questionLabel: '17. Avez-vous besoin d\'études ou d\'expertise externe ?',
    hint: 'Détermine l\'accès à MOUSSANADA (prise en charge d\'expertises jusqu\'à 1 M MAD).',
    labelOui: 'Oui — stratégie, qualité, organisation, SI…',
    labelNon: 'Non, pas de besoin de conseil',
  },
]

// ── Utilitaires ───────────────────────────────────────────────────────────────

/** Renvoie la liste des champs qu'il faut encore poser (manquants + condition remplie) */
export function getChampsAPoser(reponses: Partial<Reponses>): (keyof Reponses)[] {
  return WIZARD_QUESTIONS_MA
    .filter((q) => {
      const condOk = !q.showCondition || q.showCondition(reponses)
      const manquant = reponses[q.champ] === undefined
      return condOk && manquant
    })
    .map((q) => q.champ)
}

/** Label d'affichage d'une valeur dans le récapitulatif */
export function getDisplayLabel(champ: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'number') return String(value)
  const l = LABELS as Record<string, unknown>
  const fieldLabels = l[champ]
  if (!fieldLabels) return String(value)
  if (Array.isArray(fieldLabels)) return String(value)
  if (typeof fieldLabels === 'object') {
    return (fieldLabels as Record<string, string>)[String(value)] ?? String(value)
  }
  return String(value)
}

/** Génère le schéma JSON à injecter dans le prompt système */
export function buildExtractionSchema(): string {
  const schema: Record<string, object> = {}
  for (const q of WIZARD_QUESTIONS_MA) {
    const entry: Record<string, unknown> = {
      description: q.extractionLabel,
      type: q.type,
    }
    if (q.extractionHint) entry.hint = q.extractionHint
    if (q.type === 'enum') entry.options = q.options
    schema[q.champ] = entry
  }
  return JSON.stringify(schema, null, 2)
}
