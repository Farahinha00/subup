// ── Documents requis generation schema ────────────────────────────────────────

export type TypeDocumentEntreprise =
  | 'rc' | 'ice' | 'statuts' | 'attestation_cnsss'
  | 'dernier_bilan' | 'cin_dirigeant' | 'patente'
  | 'attestation_fiscale' | 'autre'

export interface Condition {
  champ: string
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'null' | 'not_null'
  valeur?: unknown
}

export interface CoffreFortRequis {
  type_document: TypeDocumentEntreprise
  label: string
  description?: string
  obligatoire: boolean
  condition: Condition | null
}

export interface DocumentSpecifique {
  id: string
  label: string
  description?: string
  obligatoire: boolean
  modes: Array<'upload' | 'generer'>
  condition: Condition | null
}

export interface QuestionSpecifique {
  id: string
  label: string
  type: 'number' | 'text' | 'textarea' | 'select'
  unite?: string
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  obligatoire: boolean
  condition: Condition | null
  source_prefill: string | null
  utilise_par: string[]
}

export interface ChampSource {
  id: string
  source: string
}

export interface ValidationRegle {
  regle: 'sections_presentes' | 'coherence_montants' | 'equilibre_ressources_emplois'
  config: Record<string, unknown>
}

export interface DocumentAGenerer {
  id: string
  type_document: string
  label: string
  description?: string
  format: 'docx'
  ordre: number
  mode: 'upload' | 'generer' | 'choix'
  champs_requis: ChampSource[]
  questions_contexte?: QuestionSpecifique[]
  validations: ValidationRegle[]
}

export interface DocumentsRequisGeneration {
  version: string
  lien_formulaire_officiel?: string
  coffre_fort_requis: CoffreFortRequis[]
  documents_specifiques: DocumentSpecifique[]
  questions_specifiques: QuestionSpecifique[]
  documents_a_generer: DocumentAGenerer[]
}

// ── Coffre-fort ────────────────────────────────────────────────────────────────

export type StatutDocument = 'en_analyse' | 'valide' | 'a_verifier'

export interface ChampExtrait {
  value: unknown
  confidence: 'certain' | 'inferred' | 'missing'
}

export interface DocumentEntreprise {
  id: string
  user_id: string
  type_document: TypeDocumentEntreprise
  source: 'upload' | 'saisie_manuelle'
  fichier_url: string | null
  fichier_nom: string | null
  donnees_extraites: Record<string, ChampExtrait> | null
  donnees_manuelles: Record<string, unknown> | null
  statut: StatutDocument
  created_at: string
  updated_at: string
}

// ── Crédits ────────────────────────────────────────────────────────────────────

export interface Credit {
  id: string
  user_id: string
  solde: number
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  delta: number
  motif: 'achat' | 'consommation' | 'expiration'
  pack_achete: string | null
  prix_paye: number | null
  date_expiration: string | null
  created_at: string
}

export interface PackDossier {
  id: string
  label: string
  nb_dossiers: number
  prix_total: number
  prix_unitaire: number
  badge: string | null
  actif: boolean
  ordre: number
}

// ── Dossiers ───────────────────────────────────────────────────────────────────

export type StatutDossier =
  | 'paiement_effectue'
  | 'documents_en_cours'
  | 'questions_en_cours'
  | 'generation_en_cours'
  | 'pret'
  | 'erreur'

export interface DossierGenere {
  id: string
  user_id: string
  diagnostic_id: string | null
  dispositif_id: string
  statut: StatutDossier
  credit_transaction_id: string | null
  donnees_completes: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type StatutDocGenere = 'en_attente' | 'en_cours' | 'genere' | 'erreur'

export interface DocumentGenere {
  id: string
  dossier_id: string
  type_document: string
  label: string
  fichier_url: string | null
  format: 'docx' | 'xlsx' | 'pdf'
  version: number
  statut: StatutDocGenere
  created_at: string
}

// ── Context for evalCondition / resolveSource ─────────────────────────────────

export interface DossierContext {
  profile: Record<string, unknown>
  diagnostic: {
    reponses: Record<string, unknown>
    description_projet?: string
    pays?: string
  } | null
  coffre_fort: Record<string, DocumentEntreprise>
  questions_specifiques: Record<string, unknown>
  dispositif: Record<string, unknown>
}
