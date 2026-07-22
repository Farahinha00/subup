// Labels centralisés — modifier ici pour ajouter l'arabe (i18n v2)

export const LABELS = {
  // --- Maroc ---
  statut_juridique: {
    SARL: 'SARL (Société à Responsabilité Limitée)',
    SA: 'SA (Société Anonyme)',
    'auto-entrepreneur': 'Auto-entrepreneur',
    'pas encore créée': "Entreprise pas encore créée",
  },
  secteur: {
    industrie: 'Industrie & Manufacturing',
    services: 'Services aux entreprises',
    TIC: 'Technologies de l\'information (TIC / Tech)',
    agro: 'Agroalimentaire & Agriculture',
    artisanat: 'Artisanat',
    tourisme: 'Tourisme & Hôtellerie',
    sport_loisirs: 'Sport, loisirs & bien-être',
    economie_verte: 'Économie verte & Énergie renouvelable',
    alcool_tabac: 'Alcool / Tabac',
    immobilier_residentiel: 'Promotion immobilière résidentielle',
    autre: 'Autre secteur',
  },
  region: [
    'Tanger-Tétouan-Al Hoceima',
    'Oriental',
    'Fès-Meknès',
    'Rabat-Salé-Kénitra',
    'Béni Mellal-Khénifra',
    'Casablanca-Settat',
    'Marrakech-Safi',
    'Drâa-Tafilalet',
    'Souss-Massa',
    'Guelmim-Oued Noun',
    'Laâyoune-Sakia El Hamra',
    'Dakhla-Oued Ed-Dahab',
  ],
  effectif: {
    '0': 'Aucun salarié (fondateurs uniquement)',
    '1-5': '1 à 5 salariés',
    '6-20': '6 à 20 salariés',
    '20+': 'Plus de 20 salariés',
  },
  ca_annuel: {
    '<100K': 'Moins de 100 000 MAD',
    '100K-1M': '100 000 à 1 000 000 MAD',
    '1M-10M': '1 à 10 millions MAD',
    '10M-50M': '10 à 50 millions MAD',
    '>50M': 'Plus de 50 millions MAD',
  },
  type_projet: {
    creation: 'Création d\'entreprise / nouveau site',
    extension: 'Extension / développement',
    digitalisation: 'Digitalisation / transformation numérique',
    innovation: 'Innovation / R&D',
    export: 'Développement à l\'export',
  },
  montant_projet: {
    '<100K': 'Moins de 100 000 MAD',
    '100K-1M': '100 000 à 1 000 000 MAD',
    '1M-10M': '1 à 10 millions MAD',
    '10M-50M': '10 à 50 millions MAD',
    '>50M': 'Plus de 50 millions MAD',
  },
  emplois_prevus: {
    '0': 'Aucun emploi supplémentaire prévu',
    '1-5': '1 à 5 emplois',
    '6-20': '6 à 20 emplois',
    '20+': 'Plus de 20 emplois',
  },

  // --- France : profil ---
  forme_juridique_fr: {
    SAS: 'SAS (Société par Actions Simplifiée)',
    SASU: 'SASU (SAS Unipersonnelle)',
    SARL: 'SARL (Société à Responsabilité Limitée)',
    EURL: 'EURL (Entreprise Unipersonnelle à RL)',
    SA: 'SA (Société Anonyme)',
    SNC: 'SNC (Société en Nom Collectif)',
    EI: 'Entreprise Individuelle (EI / EIRL)',
    micro: 'Micro-entreprise / Auto-entrepreneur',
  },
  regime_fiscal: {
    IS: 'Impôt sur les Sociétés (IS)',
    IR_reel: 'IR — régime réel (BIC / BNC)',
    micro_bnc: 'Micro-entreprise (BNC)',
    micro_bic: 'Micro-entreprise (BIC)',
  },
  effectif_fr: {
    '<10': 'Moins de 10 salariés (micro-entreprise)',
    '10-49': '10 à 49 salariés (petite entreprise)',
    '50-249': '50 à 249 salariés (entreprise moyenne)',
    '250+': '250 salariés ou plus (grande entreprise)',
  },
  ca_annuel_eur: {
    '<500K': 'Moins de 500 000 €',
    '500K-2M': '500 000 € à 2 M€',
    '2M-10M': '2 M€ à 10 M€',
    '10M-50M': '10 M€ à 50 M€',
    '>50M': 'Plus de 50 M€',
  },
  nature_projet: {
    rd_verrous: 'R&D avec verrous scientifiques ou techniques',
    innovation_produit: 'Innovation produit / prototype / procédé',
    creation_amorcage: 'Création ou amorçage d\'entreprise innovante',
    dev_commercial: 'Développement commercial / export',
    autre: 'Autre nature de projet',
  },
  budget_projet: {
    '<50K': 'Moins de 50 000 €',
    '50K-200K': '50 000 € à 200 000 €',
    '200K-600K': '200 000 € à 600 000 €',
    '600K-2M': '600 000 € à 2 M€',
    '2M-5M': '2 M€ à 5 M€',
    '>5M': 'Plus de 5 M€',
  },
  region_fr: [
    'Île-de-France',
    'Auvergne-Rhône-Alpes',
    'Nouvelle-Aquitaine',
    'Occitanie',
    'Hauts-de-France',
    'Grand Est',
    'Pays de la Loire',
    'Bretagne',
    'Provence-Alpes-Côte d\'Azur',
    'Normandie',
    'Bourgogne-Franche-Comté',
    'Centre-Val de Loire',
    'Corse',
    'DOM-TOM',
  ],
  personnel_rd: {
    '0': 'Aucun',
    '1-2': '1 à 2 personnes',
    '3-10': '3 à 10 personnes',
    '10+': 'Plus de 10 personnes',
  },
  situation_personnelle: {
    demandeur_emploi: 'Demandeur d\'emploi indemnisé (ARE / ARCE)',
    beneficiaire_minima: 'Bénéficiaire de minima sociaux (RSA, ASS, AAH)',
    salarie: 'Salarié souhaitant créer ou reprendre',
    dirigeant: 'Dirigeant / gérant en activité',
    autre: 'Autre situation',
  },
  embauche_prevue: {
    non: 'Non, pas d\'embauche prévue dans les 12 mois',
    alternant: 'Oui — alternant ou apprenti',
    cdi_cdd: 'Oui — CDI ou CDD classique',
    handicap: 'Oui — personne en situation de handicap (RQTH)',
    multiple: 'Oui — plusieurs profils',
  },
  depenses_rd_15pct: {
    oui: 'Oui — plus de 15% de nos charges sont des dépenses R&D',
    non: 'Non — les dépenses R&D représentent moins de 15% des charges',
    ne_sais_pas: 'Je ne sais pas encore (à calculer avec mon expert-comptable)',
  },

  embauche_prevue_ma: {
    non: 'Non, pas d\'embauche prévue dans les 12 mois',
    cdi_juniors: 'Oui — jeunes diplômés (Bac+2 min., inscrits à l\'ANAPEC)',
    cdi_experimentes: 'Oui — profils expérimentés',
    les_deux: 'Oui — les deux profils',
  },

  // --- Commun ---
  situation_administrative: {
    oui: 'Oui, situation régulière',
    non: 'Non, situation irrégulière',
    en_cours: 'Régularisation en cours',
  },
  statut_demande: {
    nouvelle: 'Nouvelle',
    contactee: 'Contactée',
    signee: 'Signée',
    perdue: 'Perdue',
  },
  statut_resultat: {
    eligible: 'Éligible',
    probable: 'Probablement éligible',
    non_eligible: 'Non éligible',
  },

  // --- Dispositif : méta ---
  categorie_dispositif: {
    // Maroc
    investissement_croissance: 'Investissement & Croissance',
    digitalisation: 'Digitalisation',
    financement_garantie: 'Financement & Garantie',
    emploi_formation: 'Emploi & Formation',
    sectoriel_tourisme: 'Tourisme & Sectoriel',
    transition_ecologique: 'Transition écologique',
    innovation: 'Innovation',
    diaspora: 'MRE & Diaspora',
    // France
    creation_reprise: 'Création & Reprise',
    innovation_rd: 'Innovation & R&D',
    fiscal_social: 'Avantages fiscaux & sociaux',
    embauche_formation: 'Embauche & Formation',
    export: 'Export & International',
    financement_innovation: 'Financement de l\'innovation',
  } as Record<string, string>,

  type_aide: {
    subvention: 'Subvention',
    prime: 'Prime',
    credit_impot: 'Crédit d\'impôt',
    exoneration_sociale: 'Exonération sociale',
    exoneration_fiscale: 'Exonération fiscale',
    pret: 'Prêt',
    pret_honneur: 'Prêt d\'honneur',
    avance_remboursable: 'Avance remboursable',
    garantie: 'Garantie',
    accompagnement: 'Accompagnement',
    participation_capital: 'Prise de participation',
    capitalisation_droits: 'Capitalisation de droits',
  } as Record<string, string>,
}

// Conversion tranche → valeur numérique (borne inférieure) — Maroc (MAD)
export const TRANCHES_MAD: Record<string, number> = {
  '<100K': 0,
  '100K-1M': 100_000,
  '1M-10M': 1_000_000,
  '10M-50M': 10_000_000,
  '>50M': 50_000_000,
}

export const TRANCHES_EFFECTIF: Record<string, number> = {
  '0': 0,
  '1-5': 1,
  '6-20': 6,
  '20+': 21,
}

// France — effectif (tranches UE)
export const TRANCHES_EFFECTIF_FR: Record<string, number> = {
  '<10': 0,
  '10-49': 10,
  '50-249': 50,
  '250+': 250,
}

// France — CA (EUR)
export const TRANCHES_EUR_CA: Record<string, number> = {
  '<500K': 0,
  '500K-2M': 500_000,
  '2M-10M': 2_000_000,
  '10M-50M': 10_000_000,
  '>50M': 50_000_000,
}

// France — budget projet (EUR)
export const TRANCHES_EUR_BUDGET: Record<string, number> = {
  '<50K': 0,
  '50K-200K': 50_000,
  '200K-600K': 200_000,
  '600K-2M': 600_000,
  '2M-5M': 2_000_000,
  '>5M': 5_000_000,
}

// Régions contenant des provinces exclues de la prime territoriale (Charte TPME)
// Source : BO n°7454 du 06/11/2025 — liste à compléter si nécessaire
export const REGIONS_PRIME_TERRITORIALE_PARTIELLE: string[] = [
  'Casablanca-Settat',
  'Rabat-Salé-Kénitra',
  'Tanger-Tétouan-Al Hoceima',
  'Marrakech-Safi',
]

// Ordre d'affichage des catégories dans les résultats (MA d'abord, puis FR)
export const ORDRE_CATEGORIES = [
  // Maroc
  'investissement_croissance',
  'digitalisation',
  'financement_garantie',
  'innovation',
  'emploi_formation',
  'transition_ecologique',
  'sectoriel_tourisme',
  'diaspora',
  // France
  'creation_reprise',
  'fiscal_social',
  'innovation_rd',
  'financement_innovation',
  'embauche_formation',
  'export',
] as const

// Couleurs de badge par type_aide
export const TYPE_AIDE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  subvention:           { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-100' },
  prime:                { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  credit_impot:         { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-100' },
  exoneration_sociale:  { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-100' },
  exoneration_fiscale:  { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-100' },
  pret:                 { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-100' },
  pret_honneur:         { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-100' },
  avance_remboursable:  { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-100' },
  garantie:             { bg: 'bg-gray-50',    text: 'text-gray-600',   border: 'border-gray-200' },
  accompagnement:       { bg: 'bg-teal-50',    text: 'text-teal-700',   border: 'border-teal-100' },
  participation_capital:{ bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-100' },
  capitalisation_droits:{ bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-100' },
}
