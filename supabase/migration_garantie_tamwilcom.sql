-- ============================================================
-- MIGRATION : Dispositifs financement_garantie Maroc (Tamwilcom)
-- INTELAKA · Damane Express · Damane Tamwin · Gamme Damane Invest · Damane Export
-- actif = true (tous exposés)
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
-- 1. INTELAKA
-- ----------------------------------------------------------
(
  'intelaka',
  'INTELAKA — Prêt bonifié + garantie création (volet urbain et rural)',
  'Tamwilcom / Banques partenaires',
  'pret',
  1000000, NULL,
  'MA', 'MAD', true,
  'financement_garantie',
  ARRAY['createur', 'auto_entrepreneur', 'tpe'],
  true,
  'Tamwilcom',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "profil_porteur",
        "label": "Créateur, auto-entrepreneur ou TPE (porteur personne physique ou morale)",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["pas encore créée", "auto-entrepreneur", "SARL", "SA"],
        "bloquant": false,
        "message_echec": "INTELAKA cible les créateurs d''entreprise, auto-entrepreneurs et TPE. Les entreprises plus grandes peuvent explorer Damane Tamwin."
      },
      {
        "id": "entreprise_jeune",
        "label": "Projet de création ou entreprise récente (≤ 5 ans)",
        "type": "range",
        "champ": "annee_creation",
        "min": "2020",
        "max": null,
        "bloquant": false,
        "message_echec": "INTELAKA est orienté vers la création et les entreprises récentes (< 5 ans). Les entreprises plus anciennes peuvent accéder à la gamme Damane Investissement/Croissance."
      },
      {
        "id": "plafond_montant",
        "label": "Montant du projet dans les plafonds indicatifs INTELAKA (≤ 1 M MAD volet urbain)",
        "type": "range",
        "champ": "montant_projet",
        "min": null,
        "max": "1000000",
        "bloquant": false,
        "message_echec": "Le volet urbain INTELAKA est indicativement plafonné à 500 K – 1 M MAD. Le volet rural (Intelak Al Moustatmir Al Qarawi) peut aller jusqu''à 1,5 M MAD. Vérifiez avec votre banque partenaire."
      },
      {
        "id": "financement_bancaire",
        "label": "Financement bancaire envisagé (INTELAKA est un prêt accordé par votre banque)",
        "type": "boolean",
        "champ": "pret_bancaire_ma",
        "valeur": true,
        "bloquant": false,
        "message_echec": "INTELAKA est un prêt bonifié accordé par une banque partenaire, garanti par Tamwilcom. La démarche passe par votre banque, pas directement par Tamwilcom."
      }
    ]
  }',
  '["Formulaire de demande via banque partenaire INTELAKA", "Business plan ou description du projet", "Pièce d''identité du porteur (CIN)", "Statuts ou formulaire de création si pas encore constitué", "CV du porteur de projet", "Justificatif de domicile professionnel"]',
  '15 à 45 jours (décision banque + accord Tamwilcom)',
  'https://www.tamwilcom.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 2. DAMANE EXPRESS
-- ----------------------------------------------------------
(
  'damane-express',
  'Damane Express — Garantie crédit TPE procédure simplifiée (≤ 1 M MAD, décision 15-30 j)',
  'Tamwilcom / Banques partenaires',
  'garantie',
  1000000, 80,
  'MA', 'MAD', true,
  'financement_garantie',
  ARRAY['auto_entrepreneur', 'tpe'],
  true,
  'Tamwilcom',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "statut_immatricule",
        "label": "TPE ou auto-entrepreneur immatriculé (RC + ICE)",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["auto-entrepreneur", "SARL", "SA"],
        "bloquant": true,
        "message_echec": "Damane Express requiert une immatriculation au RC (numéro ICE). Les projets non encore créés doivent d''abord s''immatriculer."
      },
      {
        "id": "taille_tpe",
        "label": "TPE : CA indicatif < 10 M MAD",
        "type": "range",
        "champ": "ca_annuel",
        "min": null,
        "max": "10000000",
        "bloquant": false,
        "message_echec": "Damane Express cible principalement les TPE. Si votre CA dépasse 10 M MAD, Damane Tamwin ou Damane Investissement sont plus adaptés."
      },
      {
        "id": "financement_bancaire",
        "label": "Crédit bancaire en cours de négociation",
        "type": "boolean",
        "champ": "pret_bancaire_ma",
        "valeur": true,
        "bloquant": true,
        "message_echec": "Damane Express est une garantie sur un crédit bancaire. La démarche passe obligatoirement par une banque partenaire Tamwilcom."
      }
    ]
  }',
  '["Demande de crédit déposée auprès de votre banque", "CIN du dirigeant", "ICE de l''entreprise", "RC (extrait récent)", "Patente (si applicable)", "Description succincte du besoin de financement"]',
  '15 à 30 jours (procédure simplifiée)',
  'https://www.tamwilcom.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 3. DAMANE TAMWIN
-- ----------------------------------------------------------
(
  'damane-tamwin',
  'Damane Tamwin — Garantie crédits PME investissement & fonctionnement (jusqu''à 5 M MAD, quotité ~80%)',
  'Tamwilcom / Banques partenaires',
  'garantie',
  5000000, 80,
  'MA', 'MAD', true,
  'financement_garantie',
  ARRAY['tpe', 'pme'],
  true,
  'Tamwilcom',
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
        "message_echec": "Damane Tamwin cible les PME formellement constituées (SARL, SA). Les auto-entrepreneurs peuvent accéder à Damane Express."
      },
      {
        "id": "seuil_ca",
        "label": "CA annuel inférieur au seuil PME Tamwilcom (indicatif : < 175 M MAD)",
        "type": "range",
        "champ": "ca_annuel",
        "min": null,
        "max": "174999999",
        "bloquant": false,
        "message_echec": "Damane Tamwin cible les PME dont le CA est inférieur à 175 M MAD. Si votre entreprise dépasse ce seuil, contactez directement Tamwilcom pour les produits Grandes Entreprises."
      },
      {
        "id": "financement_bancaire",
        "label": "Crédit bancaire d''investissement ou de fonctionnement en cours de négociation",
        "type": "boolean",
        "champ": "pret_bancaire_ma",
        "valeur": true,
        "bloquant": true,
        "message_echec": "Damane Tamwin est une garantie sur un crédit bancaire. La démarche passe obligatoirement par une banque partenaire Tamwilcom."
      }
    ]
  }',
  '["Demande de crédit déposée auprès de votre banque", "Business plan ou note de présentation du projet", "États financiers des 3 dernières années", "RC et statuts de la société", "Attestation fiscale et CNSS", "RIB professionnel"]',
  '30 à 60 jours',
  'https://www.tamwilcom.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 4. GAMME DAMANE CRÉATION / INVESTISSEMENT / CROISSANCE
--    (3 volets consolidés en 1 dispositif pour éviter la répétition)
-- ----------------------------------------------------------
(
  'damane-invest-creation',
  'Gamme Damane — Création, Investissement & Croissance (jusqu''à 25 M MAD, durées jusqu''à 15 ans)',
  'Tamwilcom / Banques partenaires',
  'garantie',
  25000000, 80,
  'MA', 'MAD', true,
  'financement_garantie',
  ARRAY['tpe', 'pme'],
  true,
  'Tamwilcom',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "statut_constitue",
        "label": "Entreprise formellement constituée (SARL ou SA)",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["SARL", "SA"],
        "bloquant": true,
        "message_echec": "La gamme Damane Investissement/Croissance cible les entreprises formellement constituées. Pour les créateurs non encore immatriculés, consultez INTELAKA."
      },
      {
        "id": "type_investissement",
        "label": "Projet d''investissement : création, extension, équipement ou innovation",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["creation", "extension", "innovation"],
        "bloquant": false,
        "message_echec": "La gamme Damane Investissement cible les projets d''immobilisation (achat terrain, construction, équipements, fonds de commerce). Les projets purement digitaux ou d''export ont d''autres volets dédiés."
      },
      {
        "id": "montant_significatif",
        "label": "Projet d''investissement significatif (≥ 1 M MAD)",
        "type": "range",
        "champ": "montant_projet",
        "min": "1000000",
        "max": null,
        "bloquant": false,
        "message_echec": "La gamme Damane Investissement est adaptée à des projets d''envergure (≥ 1 M MAD : terrain, construction, équipements lourds). Pour des besoins inférieurs, Damane Express ou Damane Tamwin sont plus appropriés."
      },
      {
        "id": "financement_bancaire",
        "label": "Crédit bancaire d''investissement envisagé",
        "type": "boolean",
        "champ": "pret_bancaire_ma",
        "valeur": true,
        "bloquant": true,
        "message_echec": "La gamme Damane est une garantie sur un crédit bancaire. La démarche passe obligatoirement par une banque partenaire Tamwilcom."
      }
    ]
  }',
  '["Demande de crédit déposée auprès de votre banque", "Business plan complet avec plan de financement", "Devis ou promesses de vente pour les immobilisations", "États financiers (3 derniers exercices)", "RC et statuts", "Attestation fiscale et CNSS", "RIB professionnel"]',
  '45 à 90 jours (selon complexité du dossier)',
  'https://www.tamwilcom.ma',
  '2026-07-06',
  true
),

-- ----------------------------------------------------------
-- 5. DAMANE EXPORT
-- ----------------------------------------------------------
(
  'damane-export',
  'Damane Export — Garantie crédits export (~70% quotité)',
  'Tamwilcom / Banques partenaires',
  'garantie',
  NULL, 70,
  'MA', 'MAD', true,
  'financement_garantie',
  ARRAY['tpe', 'pme'],
  true,
  'Tamwilcom',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "dimension_export",
        "label": "Activité ou projet à dimension export",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["export"],
        "bloquant": true,
        "message_echec": "Damane Export est réservé aux entreprises ayant une activité d''export existante ou un projet d''export identifié. Si votre projet est d''un autre type, ce dispositif ne s''applique pas."
      },
      {
        "id": "statut_constitue",
        "label": "Entreprise formellement constituée (SARL ou SA)",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["SARL", "SA"],
        "bloquant": true,
        "message_echec": "Damane Export cible les PME formellement constituées ayant une activité à l''international."
      },
      {
        "id": "financement_bancaire",
        "label": "Crédit export en cours de négociation avec votre banque",
        "type": "boolean",
        "champ": "pret_bancaire_ma",
        "valeur": true,
        "bloquant": true,
        "message_echec": "Damane Export est une garantie sur un crédit bancaire dédié à l''export. La démarche passe par une banque partenaire Tamwilcom."
      }
    ]
  }',
  '["Demande de crédit export déposée auprès de votre banque", "Contrats ou bons de commande à l''export", "États financiers récents", "RC et statuts", "Attestation fiscale", "RIB professionnel"]',
  '30 à 60 jours',
  'https://www.tamwilcom.ma',
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
SELECT slug, nom, categorie, type_aide, actif, operateur, montant_max, taux
FROM dispositifs
WHERE categorie = 'financement_garantie'
ORDER BY slug;
