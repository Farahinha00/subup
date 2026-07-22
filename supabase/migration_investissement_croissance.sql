-- ============================================================
-- MIGRATION : dispositifs investissement_croissance + innovation
-- IMTIAZ · MOUSSANADA · TATWIR · FORSA · PACTE TPME
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
-- 1. IMTIAZ (appels à projets — guichet fermé entre éditions)
-- ----------------------------------------------------------
(
  'imtiaz',
  'IMTIAZ — Prime de compétitivité et de croissance pour PME à fort potentiel',
  'Maroc PME',
  'prime',
  5000000, 20,
  'MA', 'MAD', false,
  'investissement_croissance',
  ARRAY['pme'],
  false,
  'Maroc PME',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "statut_pme",
        "label": "PME formellement constituée (SARL ou SA)",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["SARL", "SA"],
        "bloquant": true,
        "message_echec": "IMTIAZ cible les PME formellement constituées (SARL, SA) avec états financiers certifiés. Les auto-entrepreneurs ne sont pas éligibles."
      },
      {
        "id": "projet_structurant",
        "label": "Projet d''investissement structurant (extension, digitalisation ou innovation)",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["extension", "digitalisation", "innovation"],
        "bloquant": false,
        "message_echec": "IMTIAZ finance des projets de développement ambitieux (expansion, modernisation, innovation). Les projets de création pure relèvent d''autres dispositifs."
      },
      {
        "id": "projet_significatif",
        "label": "Investissement significatif (≥ 1 M MAD)",
        "type": "range",
        "champ": "montant_projet",
        "min": "1000000",
        "max": null,
        "bloquant": false,
        "message_echec": "IMTIAZ est calibré pour des investissements d''envergure. Les petits projets (< 1 M MAD) ont un rapport coût-démarche défavorable pour ce dispositif."
      },
      {
        "id": "situation_regularisee",
        "label": "Situation fiscale et sociale régulière (états financiers disponibles)",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "IMTIAZ exige des états financiers certifiés et une situation fiscale/CNSS régulière. Un rating bancaire peut être demandé selon les éditions."
      }
    ]
  }',
  '["Formulaire de candidature IMTIAZ (marocpme.gov.ma)", "Business plan complet avec plan de financement", "États financiers certifiés (3 derniers exercices)", "RC et statuts de la société", "Attestation DGI et CNSS à jour", "CV des dirigeants", "Descriptif détaillé du projet d''investissement"]',
  '3 à 6 mois (processus d''appel à projets)',
  'https://www.marocpme.gov.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 2. MOUSSANADA (prise en charge conseil/AT)
-- ----------------------------------------------------------
(
  'moussanada',
  'MOUSSANADA — Prise en charge d''études et d''expertise externe (plans de progrès TPME)',
  'Maroc PME',
  'subvention',
  1000000, 100,
  'MA', 'MAD', true,
  'investissement_croissance',
  ARRAY['tpe', 'pme'],
  true,
  'Maroc PME',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "besoin_conseil",
        "label": "Besoin d''études ou d''expertise externe identifié (stratégie, qualité, organisation…)",
        "type": "boolean",
        "champ": "besoin_conseil_at",
        "valeur": true,
        "bloquant": true,
        "message_echec": "MOUSSANADA finance la réalisation d''études et d''expertises par des prestataires référencés Maroc PME. Sans besoin de conseil externe identifié, ce dispositif ne s''applique pas."
      },
      {
        "id": "statut_tpme",
        "label": "TPME formellement constituée",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["auto-entrepreneur", "SARL", "SA"],
        "bloquant": true,
        "message_echec": "MOUSSANADA est réservé aux TPME immatriculées. Les projets non encore créés ne sont pas éligibles."
      },
      {
        "id": "seuil_ca",
        "label": "CA annuel dans les limites TPME (indicatif : ≤ 175 M MAD)",
        "type": "range",
        "champ": "ca_annuel",
        "min": null,
        "max": "174999999",
        "bloquant": false,
        "message_echec": "MOUSSANADA cible les TPME dont le CA est inférieur à 175 M MAD. Les grandes entreprises ont d''autres dispositifs."
      }
    ]
  }',
  '["Formulaire de demande MOUSSANADA (marocpme.gov.ma)", "RC et statuts de l''entreprise", "Attestation DGI et CNSS", "Expression de besoin détaillée (domaine, périmètre de la mission)", "Devis du prestataire référencé Maroc PME", "États financiers récents"]',
  '30 à 60 jours après dépôt complet',
  'https://www.marocpme.gov.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 3. TATWIR (categorie: innovation)
-- ----------------------------------------------------------
(
  'tatwir',
  'TATWIR — Investissement + Innovation + AT pour TPME industrielles et secteurs porteurs (volet R&D jusqu''à 4 M MAD à 50%)',
  'Maroc PME',
  'subvention',
  4000000, 50,
  'MA', 'MAD', true,
  'innovation',
  ARRAY['tpe', 'pme'],
  true,
  'Maroc PME',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "secteur_eligible",
        "label": "Secteur éligible : industrie, TIC ou transition écologique",
        "type": "enum_includes",
        "champ": "secteur",
        "valeurs": ["industrie", "TIC", "economie_verte"],
        "bloquant": true,
        "message_echec": "TATWIR cible les TPME des secteurs industriels, TIC et croissance verte. Les entreprises de services généraux, tourisme ou immobilier ne sont pas éligibles."
      },
      {
        "id": "projet_rd_innovation",
        "label": "Projet à composante R&D ou innovation (études, POC, propriété industrielle…)",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["innovation", "digitalisation"],
        "bloquant": false,
        "message_echec": "TATWIR couvre l''investissement et l''innovation. Le volet R&D (jusqu''à 4 M MAD) requiert un projet avec une dimension technique identifiée (R&D, POC, brevet, business plan R&D)."
      },
      {
        "id": "investissement_significatif",
        "label": "Investissement ou budget R&D significatif (≥ 100 K MAD)",
        "type": "range",
        "champ": "montant_projet",
        "min": "100000",
        "max": null,
        "bloquant": false,
        "message_echec": "TATWIR est conçu pour des projets d''investissement ou de R&D substantiels. Le plafond subventionné peut couvrir jusqu''à 50% des dépenses R&D éligibles."
      }
    ]
  }',
  '["Formulaire de demande TATWIR (marocpme.gov.ma)", "Description technique du projet R&D ou d''investissement", "Plan de financement du projet", "États financiers des 3 derniers exercices", "RC et statuts", "Attestation DGI et CNSS", "CV des responsables R&D si applicable"]',
  '2 à 4 mois',
  'https://www.marocpme.gov.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 4. FORSA (prêt d'honneur — programme par vagues)
-- ----------------------------------------------------------
(
  'forsa',
  'FORSA — Prêt d''honneur pour porteurs de projets [programme par vagues — vérifier disponibilité]',
  'Maroc PME / Ministère de tutelle',
  'pret_honneur',
  500000, NULL,
  'MA', 'MAD', false,
  'investissement_croissance',
  ARRAY['createur', 'auto_entrepreneur', 'tpe'],
  false,
  'Maroc PME',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "porteur_ou_jeune_entreprise",
        "label": "Porteur de projet ou entreprise en phase de démarrage",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["pas encore créée", "auto-entrepreneur", "SARL"],
        "bloquant": false,
        "message_echec": "FORSA cible principalement les porteurs de projets et jeunes entrepreneurs. Les PME installées ont accès à d''autres dispositifs."
      },
      {
        "id": "entreprise_recente",
        "label": "Projet ou entreprise très récente (≤ 4 ans)",
        "type": "range",
        "champ": "annee_creation",
        "min": "2022",
        "max": null,
        "bloquant": false,
        "message_echec": "FORSA est orienté vers les créateurs et les entreprises très récentes. Les entreprises plus établies peuvent explorer IMTIAZ ou MOUSSANADA."
      },
      {
        "id": "guichet_ouvert_note",
        "label": "Vague FORSA en cours (à vérifier sur marocpme.gov.ma)",
        "type": "boolean",
        "champ": "forsa_vague_active",
        "valeur": true,
        "bloquant": false,
        "message_echec": "FORSA fonctionne par vagues d''appels à candidatures. Vérifiez l''ouverture d''une vague sur marocpme.gov.ma avant de constituer votre dossier."
      }
    ]
  }',
  '["Formulaire de candidature FORSA (marocpme.gov.ma — si vague ouverte)", "Description du projet et plan de développement", "Pièce d''identité du porteur (CIN)", "CV du porteur de projet", "Justificatifs d''immatriculation si déjà constitué"]',
  '1 à 3 mois (selon calendrier de la vague)',
  'https://www.marocpme.gov.ma',
  '2026-07-06',
  false
),

-- ----------------------------------------------------------
-- 5. PACTE TPME (méta-dispositif — statut max "probable")
-- ----------------------------------------------------------
(
  'pacte-tpme',
  'PACTE TPME — Programme-cadre de soutien à la croissance et à la résilience des TPME',
  'Maroc PME',
  'accompagnement',
  NULL, NULL,
  'MA', 'MAD', true,
  'investissement_croissance',
  ARRAY['tpe', 'pme'],
  true,
  'Maroc PME',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "statut_tpme",
        "label": "TPME immatriculée ou en cours de création",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["auto-entrepreneur", "SARL", "SA", "pas encore créée"],
        "bloquant": false,
        "message_echec": "PACTE TPME s''adresse à toutes les TPME marocaines, formelles ou en cours de formalisation."
      },
      {
        "id": "volet_applicable",
        "label": "Volet PACTE TPME applicable à votre situation (à confirmer sur marocpme.gov.ma)",
        "type": "boolean",
        "champ": "pacte_volet_confirme",
        "valeur": true,
        "bloquant": false,
        "message_echec": "PACTE TPME est un programme-cadre multi-volets (financement, accompagnement, formation, mise à niveau). Le volet adapté à votre situation se confirme sur marocpme.gov.ma ou auprès de votre CRI."
      }
    ]
  }',
  '["Formulaire de contact Maroc PME (marocpme.gov.ma)", "RC et statuts de l''entreprise", "Description synthétique de votre besoin ou projet"]',
  'Variable selon volet',
  'https://www.marocpme.gov.ma',
  '2026-07-06',
  true
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
SELECT slug, nom, categorie, type_aide, actif, guichet_ouvert, operateur
FROM dispositifs
WHERE operateur = 'Maroc PME'
ORDER BY categorie, slug;
