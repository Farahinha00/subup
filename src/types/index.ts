import type { DocumentsRequisGeneration } from './dossier'

export type UserRole = 'user' | 'admin'
export type Pays = 'MA' | 'FR'

export type CategorieDispositif =
  // Maroc
  | 'investissement_croissance'
  | 'digitalisation'
  | 'financement_garantie'
  | 'emploi_formation'
  | 'sectoriel_tourisme'
  | 'transition_ecologique'
  | 'innovation'
  | 'diaspora'
  // France
  | 'creation_reprise'
  | 'innovation_rd'
  | 'fiscal_social'
  | 'embauche_formation'
  | 'export'
  | 'financement_innovation'

export type TypeAide =
  | 'subvention'
  | 'prime'
  | 'credit_impot'
  | 'exoneration_sociale'
  | 'exoneration_fiscale'
  | 'pret'
  | 'pret_honneur'
  | 'avance_remboursable'
  | 'garantie'
  | 'accompagnement'
  | 'participation_capital'
  | 'capitalisation_droits'

export type PublicCible = 'auto_entrepreneur' | 'tpe' | 'pme' | 'eti' | 'createur' | 'startup' | 'mre'

export interface Profile {
  id: string
  prenom: string | null
  nom: string | null
  telephone: string | null
  ville: string | null
  entreprise: string | null
  role: UserRole
  created_at: string
  // Infos entreprise
  secteur: string | null
  statut_juridique: string | null
  annee_creation: number | null
  ca_annuel: string | null
  effectif: string | null
}

// ---- Dispositif ----

export type CritereType = 'boolean' | 'enum_includes' | 'enum_excludes' | 'range' | 'min_value'

export interface Critere {
  id: string
  label: string
  type: CritereType
  champ: string
  valeur?: boolean | string | number
  valeurs?: string[]
  min?: string | null
  max?: string | null
  bloquant: boolean
  message_echec: string
}

export interface Regles {
  version: number
  criteres: Critere[]
}

export interface Dispositif {
  id: string
  slug: string
  nom: string
  organisme: string
  type_aide: TypeAide | string
  categorie: CategorieDispositif | null
  public_cible: PublicCible[]
  montant_max: number | null
  taux: number | null
  pays: Pays
  devise: 'MAD' | 'EUR'
  prochaine_echeance: string | null
  millesime: number | null
  operateur: string | null
  recurrent: boolean
  recurrent_annuel: boolean
  guichet_ouvert: boolean
  soumis_de_minimis: boolean
  regles: Regles
  documents_requis: string[]
  documents_requis_generation: DocumentsRequisGeneration | null
  delai_indicatif: string | null
  lien_officiel: string | null
  derniere_verification: string | null
  actif: boolean
}

// ---- Diagnostic — Maroc ----

export type StatutJuridique = 'SARL' | 'SA' | 'auto-entrepreneur' | 'pas encore créée'
export type Secteur =
  | 'industrie' | 'services' | 'TIC' | 'agro'
  | 'artisanat' | 'tourisme' | 'sport_loisirs' | 'economie_verte'
  | 'alcool_tabac' | 'immobilier_residentiel' | 'autre'
export type Region =
  | 'Tanger-Tétouan-Al Hoceima'
  | 'Oriental'
  | 'Fès-Meknès'
  | 'Rabat-Salé-Kénitra'
  | 'Béni Mellal-Khénifra'
  | 'Casablanca-Settat'
  | 'Marrakech-Safi'
  | 'Drâa-Tafilalet'
  | 'Souss-Massa'
  | 'Guelmim-Oued Noun'
  | 'Laâyoune-Sakia El Hamra'
  | 'Dakhla-Oued Ed-Dahab'
export type TrancheCA = '<100K' | '100K-1M' | '1M-10M' | '10M-50M' | '>50M'
export type TrancheEffectif = '0' | '1-5' | '6-20' | '20+' | '<10' | '10-49' | '50-249' | '250+'
export type TypeProjet = 'creation' | 'extension' | 'digitalisation' | 'innovation' | 'export'
export type TrancheMontant = '<100K' | '100K-1M' | '1M-10M' | '10M-50M' | '>50M'
export type SituationAdmin = 'oui' | 'non' | 'en_cours'

// ---- Diagnostic — France ----

export type FormeJuridiqueFR = 'SAS' | 'SASU' | 'SARL' | 'EURL' | 'SA' | 'SNC' | 'EI' | 'micro'
export type RegimeFiscal = 'IS' | 'IR_reel' | 'micro_bnc' | 'micro_bic'
export type NatureProjetFR = 'rd_verrous' | 'innovation_produit' | 'creation_amorcage' | 'dev_commercial' | 'autre'
export type TrancheBudgetFR = '<50K' | '50K-200K' | '200K-600K' | '600K-2M' | '2M-5M' | '>5M'
export type TrancheCAEUR = '<500K' | '500K-2M' | '2M-10M' | '10M-50M' | '>50M'
export type RegionFR =
  | 'Île-de-France'
  | 'Auvergne-Rhône-Alpes'
  | 'Nouvelle-Aquitaine'
  | 'Occitanie'
  | 'Hauts-de-France'
  | 'Grand Est'
  | 'Pays de la Loire'
  | 'Bretagne'
  | 'Provence-Alpes-Côte d\'Azur'
  | 'Normandie'
  | 'Bourgogne-Franche-Comté'
  | 'Centre-Val de Loire'
  | 'Corse'
  | 'DOM-TOM'

export type TrancheEffectifFR = '<10' | '10-49' | '50-249' | '250+'

export type SituationPersonnelle =
  | 'demandeur_emploi'
  | 'beneficiaire_minima'
  | 'salarie'
  | 'dirigeant'
  | 'autre'

export type EmbauchePrevue = 'non' | 'alternant' | 'cdi_cdd' | 'handicap' | 'multiple'

export type EmbauchePrevueMA = 'non' | 'cdi_juniors' | 'cdi_experimentes' | 'les_deux'

export type DepensesRD15Pct = 'oui' | 'non' | 'ne_sais_pas'

export interface Reponses {
  pays: Pays

  // --- Maroc ---
  statut_juridique?: StatutJuridique
  secteur?: Secteur
  region?: Region
  montant_projet?: TrancheMontant
  capital_independant?: boolean
  province_eligible_territoriale?: boolean
  type_projet?: TypeProjet
  emplois_prevus?: TrancheEffectif
  autofinancement_ok?: boolean
  porteur_mre?: boolean
  dimension_ecologique_ma?: boolean
  ehtc_classe?: boolean
  embauche_prevue_ma?: EmbauchePrevueMA
  pret_bancaire_ma?: boolean
  besoin_conseil_at?: boolean

  // --- France : profil ---
  forme_juridique_fr?: FormeJuridiqueFR
  regime_fiscal?: RegimeFiscal
  region_fr?: RegionFR
  situation_personnelle?: SituationPersonnelle

  // --- France : projet ---
  nature_projet?: NatureProjetFR
  budget_projet?: TrancheBudgetFR
  depenses_engagees?: boolean
  cofinancement_ok?: boolean
  personnel_rd?: string
  embauche_prevue?: EmbauchePrevue
  dimension_export?: boolean
  dimension_ecologique?: boolean
  dimension_numerique?: boolean

  // --- France : admin ---
  deja_cir_cii?: boolean
  pret_bancaire_prevu?: boolean
  depenses_rd_15pct?: DepensesRD15Pct
  techno_recherche?: boolean

  // --- Commun ---
  annee_creation?: number
  effectif?: TrancheEffectif | TrancheEffectifFR
  ca_annuel?: TrancheCA | TrancheCAEUR
  situation_administrative?: SituationAdmin
  aide_anterieure?: boolean
  accompagnement_structure?: boolean
}

export interface Diagnostic {
  id: string
  user_id: string
  pays: Pays
  reponses: Reponses
  created_at: string
  titre?: string | null
}

// ---- Résultats ----

export type StatutResultat = 'eligible' | 'probable' | 'non_eligible'

export interface CritereResultat {
  id: string
  label: string
  message_echec?: string
}

export interface Resultat {
  id: string
  diagnostic_id: string
  dispositif_id: string
  score: number
  statut: StatutResultat
  criteres_ok: CritereResultat[]
  criteres_manquants: CritereResultat[]
  criteres_bloquants: CritereResultat[]
  dispositif?: Dispositif
}

// ---- Demandes ----

export type StatutDemande = 'nouvelle' | 'contactee' | 'signee' | 'perdue'

export interface DemandeAccompagnement {
  id: string
  user_id: string
  diagnostic_id: string
  dispositif_id: string
  message: string | null
  statut: StatutDemande
  archivee: boolean
  created_at: string
  profile?: Profile
  dispositif?: Dispositif
}
