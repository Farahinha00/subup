-- ============================================================
-- MIGRATION : tourisme · transition_ecologique · diaspora
-- GO SIYAHA · CAP HOSPITALITY · MOUSSANADA SIYAHA
-- TATWIR CROISSANCE VERTE · MDM INVEST
-- Idempotent via ON CONFLICT (slug) DO UPDATE
-- ============================================================

INSERT INTO dispositifs (
  slug, nom, organisme, type_aide,
  montant_max, taux,
  pays, devise, recurrent,
  categorie, public_cible, guichet_ouvert, operateur,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) VALUES

-- ----------------------------------------------------------
-- 1. GO SIYAHA
-- ----------------------------------------------------------
(
  'go-siyaha',
  'GO SIYAHA — Assistance technique (jusqu''à 90%) + primes d''investissement touristique',
  'Ministère du Tourisme / Maroc PME',
  'subvention',
  5000000, 90,
  'MA', 'MAD', false,
  'sectoriel_tourisme',
  ARRAY['tpe', 'pme', 'createur'],
  false,
  'Maroc PME',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "secteur_tourisme",
        "label": "Secteur tourisme, hébergement, animation ou sport & loisirs",
        "type": "enum_includes",
        "champ": "secteur",
        "valeurs": ["tourisme", "sport_loisirs"],
        "bloquant": true,
        "message_echec": "GO SIYAHA cible les entreprises des secteurs tourisme, hébergement, animation culturelle et sport & loisirs. Les autres secteurs ne sont pas éligibles à ce programme."
      },
      {
        "id": "type_projet",
        "label": "Projet de création, de rénovation ou d''animation innovante",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["creation", "extension", "innovation"],
        "bloquant": false,
        "message_echec": "GO SIYAHA est optimisé pour les projets de création, développement ou animation innovante dans le tourisme. Les projets de digitalisation pure peuvent être moins prioritaires."
      }
    ]
  }',
  '["Formulaire de candidature GO SIYAHA (Ministère du Tourisme / marocpme.gov.ma)", "Étude de projet ou note de présentation", "RC et statuts (ou formulaire de création)", "Attestation DGI et CNSS (si entreprise existante)", "Devis des études ou travaux envisagés", "CV des porteurs de projet"]',
  '2 à 5 mois (processus d''appel à projets)',
  'https://www.marocpme.gov.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 2. CAP HOSPITALITY
-- ----------------------------------------------------------
(
  'cap-hospitality',
  'CAP HOSPITALITY — Subvention rénovation des établissements d''hébergement touristique classés (EHTC)',
  'Ministère du Tourisme / Maroc PME',
  'subvention',
  NULL, 30,
  'MA', 'MAD', false,
  'sectoriel_tourisme',
  ARRAY['tpe', 'pme'],
  false,
  'Maroc PME',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "ehtc_classe",
        "label": "Établissement d''hébergement touristique classé (EHTC : hôtel, riad, maison d''hôtes avec classification officielle)",
        "type": "boolean",
        "champ": "ehtc_classe",
        "valeur": true,
        "bloquant": true,
        "message_echec": "CAP HOSPITALITY est exclusivement réservé aux établissements d''hébergement touristique classés (EHTC) disposant d''une classification officielle du Ministère du Tourisme. Les hébergements non classés ne sont pas éligibles."
      },
      {
        "id": "secteur_tourisme",
        "label": "Secteur tourisme & hébergement",
        "type": "enum_includes",
        "champ": "secteur",
        "valeurs": ["tourisme"],
        "bloquant": true,
        "message_echec": "CAP HOSPITALITY est réservé aux établissements du secteur tourisme & hébergement."
      },
      {
        "id": "projet_renovation",
        "label": "Projet de rénovation ou de mise à niveau de l''établissement",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["extension"],
        "bloquant": false,
        "message_echec": "CAP HOSPITALITY finance la rénovation des EHTC. Un projet de rénovation/extension doit être identifié."
      }
    ]
  }',
  '["Formulaire de candidature CAP HOSPITALITY (Ministère du Tourisme)", "Titre de classification EHTC (arrêté de classement)", "Descriptif des travaux de rénovation envisagés", "Devis des travaux (au moins 2 devis comparatifs)", "RC et statuts de l''entreprise", "Attestation DGI et CNSS", "Photos de l''état actuel de l''établissement"]',
  '3 à 6 mois',
  'https://www.marocpme.gov.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 3. MOUSSANADA SIYAHA
-- ----------------------------------------------------------
(
  'moussanada-siyaha',
  'MOUSSANADA SIYAHA — Conseil et mise à niveau des PME touristiques (plan de progrès jusqu''à 1 M MAD)',
  'Maroc PME / Ministère du Tourisme',
  'subvention',
  1000000, 100,
  'MA', 'MAD', true,
  'sectoriel_tourisme',
  ARRAY['tpe', 'pme'],
  true,
  'Maroc PME',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "secteur_tourisme",
        "label": "Secteur tourisme (hébergement classé, agence de voyages, transport touristique)",
        "type": "enum_includes",
        "champ": "secteur",
        "valeurs": ["tourisme"],
        "bloquant": true,
        "message_echec": "MOUSSANADA SIYAHA est dédié aux PME du tourisme : hébergements classés, agences de voyages agréées et transport touristique. Les autres secteurs relèvent de MOUSSANADA généraliste."
      },
      {
        "id": "besoin_conseil",
        "label": "Besoin d''études ou d''expertise externe identifié (qualité, stratégie, IT, organisation…)",
        "type": "boolean",
        "champ": "besoin_conseil_at",
        "valeur": true,
        "bloquant": true,
        "message_echec": "MOUSSANADA SIYAHA finance des plans de progrès réalisés par des prestataires référencés. Sans besoin de conseil externe identifié, le dispositif ne s''applique pas."
      },
      {
        "id": "seuil_ca",
        "label": "CA annuel dans les limites PME touristique (indicatif : ≤ 175 M MAD)",
        "type": "range",
        "champ": "ca_annuel",
        "min": null,
        "max": "174999999",
        "bloquant": false,
        "message_echec": "MOUSSANADA SIYAHA cible les PME touristiques dont le CA est inférieur à 175 M MAD. Une note bancaire peut être demandée selon les éditions."
      }
    ]
  }',
  '["Formulaire de demande MOUSSANADA SIYAHA (marocpme.gov.ma)", "RC et statuts de l''entreprise", "Attestation DGI et CNSS", "Expression de besoin détaillée (domaine, périmètre de la mission)", "Devis du prestataire référencé Maroc PME", "États financiers récents", "Note bancaire ou attestation bancaire (selon édition)"]',
  '30 à 60 jours après dépôt complet',
  'https://www.marocpme.gov.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 4. TATWIR CROISSANCE VERTE
-- ----------------------------------------------------------
(
  'tatwir-croissance-verte',
  'TATWIR Croissance Verte — Décarbonation, efficacité énergétique et technologies propres pour TPME industrielles (jusqu''à ~40%)',
  'Maroc PME',
  'subvention',
  NULL, 40,
  'MA', 'MAD', true,
  'transition_ecologique',
  ARRAY['tpe', 'pme'],
  true,
  'Maroc PME',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "secteur_industriel",
        "label": "Secteur industriel ou économie verte",
        "type": "enum_includes",
        "champ": "secteur",
        "valeurs": ["industrie", "economie_verte"],
        "bloquant": true,
        "message_echec": "TATWIR Croissance Verte cible les TPME industrielles et les entreprises de l''économie verte. Les entreprises de services généraux, tourisme ou immobilier ne sont pas éligibles."
      },
      {
        "id": "dimension_ecologique",
        "label": "Projet à dimension environnementale (efficacité énergétique, décarbonation, technologies propres)",
        "type": "boolean",
        "champ": "dimension_ecologique_ma",
        "valeur": true,
        "bloquant": true,
        "message_echec": "TATWIR Croissance Verte finance des investissements à impact environnemental mesurable : réduction d''empreinte carbone, efficacité énergétique, économie circulaire, technologies propres. Sans dimension écologique, le volet TATWIR Innovation est plus adapté."
      },
      {
        "id": "investissement_significatif",
        "label": "Investissement ou projet de transition énergétique identifié",
        "type": "range",
        "champ": "montant_projet",
        "min": "100000",
        "max": null,
        "bloquant": false,
        "message_echec": "TATWIR Croissance Verte est conçu pour des projets de transition substantiels. Les petits achats d''équipements ponctuels (< 100 K MAD) peuvent avoir un rapport coût-démarche défavorable."
      }
    ]
  }',
  '["Formulaire de demande TATWIR Croissance Verte (marocpme.gov.ma)", "Description technique du projet de transition écologique", "Bilan carbone ou audit énergétique initial (si disponible)", "Plan de financement du projet", "États financiers (3 derniers exercices)", "RC et statuts", "Attestation DGI et CNSS"]',
  '2 à 4 mois',
  'https://www.marocpme.gov.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 5. MDM INVEST (actif=false — paramètres à vérifier sur tamwilcom.ma)
-- ----------------------------------------------------------
(
  'mdm-invest',
  'MDM INVEST — Cofinancement et garantie pour Marocains Résidant à l''Étranger (MRE) qui investissent au Maroc [paramètres à vérifier sur tamwilcom.ma]',
  'Tamwilcom / CDG',
  'subvention',
  NULL, NULL,
  'MA', 'MAD', true,
  'diaspora',
  ARRAY['mre', 'createur', 'tpe'],
  true,
  'Tamwilcom',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "porteur_mre",
        "label": "Porteur Marocain Résidant à l''Étranger (MRE)",
        "type": "boolean",
        "champ": "porteur_mre",
        "valeur": true,
        "bloquant": true,
        "message_echec": "MDM INVEST est exclusivement réservé aux Marocains Résidant à l''Étranger (MRE) qui souhaitent investir au Maroc. Les résidents marocains ont accès aux autres dispositifs Tamwilcom et Maroc PME."
      },
      {
        "id": "projet_investissement",
        "label": "Projet de création ou d''investissement au Maroc",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["creation", "extension"],
        "bloquant": true,
        "message_echec": "MDM INVEST finance les projets de création ou d''extension d''activité des MRE au Maroc. Les projets de digitalisation ou d''export seuls ne sont pas couverts par ce dispositif."
      },
      {
        "id": "parametres_verifies",
        "label": "Paramètres MDM INVEST à confirmer sur tamwilcom.ma (apport en devises, plafonds, taux de cofinancement)",
        "type": "boolean",
        "champ": "mdm_conditions_confirmees",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Les paramètres MDM INVEST (taux d''apport en devises requis, plafonds de financement, taux de cofinancement) doivent être vérifiés sur tamwilcom.ma ou auprès d''une banque partenaire avant de constituer votre dossier."
      }
    ]
  }',
  '["Formulaire de demande MDM INVEST (tamwilcom.ma — à vérifier)", "Pièce d''identité MRE (passeport + carte de résidence)", "Business plan complet du projet au Maroc", "Justificatif d''origine des fonds en devises", "RC ou formulaire de création de la société au Maroc", "Plan de financement détaillé", "Attestation d''immatriculation consulaire si applicable"]',
  'Variable (à confirmer sur tamwilcom.ma)',
  'https://www.tamwilcom.ma',
  '2026-07-06',
  false
)

ON CONFLICT (slug) DO UPDATE SET
  nom                   = EXCLUDED.nom,
  organisme             = EXCLUDED.organisme,
  type_aide             = EXCLUDED.type_aide,
  montant_max           = EXCLUDED.montant_max,
  taux                  = EXCLUDED.taux,
  categorie             = EXCLUDED.categorie,
  public_cible          = EXCLUDED.public_cible,
  guichet_ouvert        = EXCLUDED.guichet_ouvert,
  operateur             = EXCLUDED.operateur,
  regles                = EXCLUDED.regles,
  documents_requis      = EXCLUDED.documents_requis,
  delai_indicatif       = EXCLUDED.delai_indicatif,
  lien_officiel         = EXCLUDED.lien_officiel,
  derniere_verification = EXCLUDED.derniere_verification,
  actif                 = EXCLUDED.actif;

-- Vérification
SELECT slug, categorie, type_aide, actif, guichet_ouvert, operateur
FROM dispositifs
WHERE categorie IN ('sectoriel_tourisme', 'transition_ecologique', 'diaspora')
ORDER BY categorie, slug;
