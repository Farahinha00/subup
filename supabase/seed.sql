-- ============================================================
-- SEED — 5 dispositifs de subvention initiaux
-- ============================================================
-- IMPORTANT : Ces critères sont INDICATIFS et ont été établis à partir de
-- sources secondaires (marocpme.gov.ma, CRI régionaux, add.gov.ma, BO n°7454).
-- Ils DOIVENT être vérifiés et mis à jour depuis les sources officielles
-- avant toute mise en production. Utilisez le champ `derniere_verification`
-- pour tracer la date de dernière vérification.
-- ============================================================

insert into dispositifs (
  slug, nom, organisme, type_aide,
  montant_max, taux,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values

-- ============================================================
-- 1. CHARTE TPME (CRI)
-- ============================================================
(
  'charte-tpme',
  'Charte de l''Investissement — Dispositif TPME',
  'Centres Régionaux d''Investissement (CRI)',
  'Subvention directe (3 primes cumulables : emploi + territoriale + secteur prioritaire)',
  15000000, 30,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "statut_juridique",
        "label": "Personne morale de droit privé marocain (SARL ou SA)",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["SARL", "SA"],
        "bloquant": true,
        "message_echec": "Seules les personnes morales (SARL, SA) sont éligibles. Les auto-entrepreneurs et entreprises non encore créées sont exclus."
      },
      {
        "id": "ca_min",
        "label": "CA annuel ≥ 1 M MAD (sur l''une des 3 dernières années)",
        "type": "range",
        "champ": "ca_annuel",
        "min": "1000000",
        "max": null,
        "bloquant": true,
        "message_echec": "Le chiffre d''affaires doit atteindre au moins 1 M MAD sur l''une des 3 dernières années."
      },
      {
        "id": "ca_max",
        "label": "CA annuel < 200 M MAD (critère TPME)",
        "type": "range",
        "champ": "ca_annuel",
        "min": null,
        "max": "199999999",
        "bloquant": true,
        "message_echec": "Votre CA dépasse 200 M MAD : votre entreprise n''est plus classée TPME au sens de la Charte."
      },
      {
        "id": "montant_min",
        "label": "Montant du projet ≥ 1 M MAD",
        "type": "range",
        "champ": "montant_projet",
        "min": "1000000",
        "max": null,
        "bloquant": true,
        "message_echec": "Le montant du projet doit dépasser 1 M MAD pour ce dispositif."
      },
      {
        "id": "montant_max",
        "label": "Montant du projet ≤ 50 M MAD",
        "type": "range",
        "champ": "montant_projet",
        "min": null,
        "max": "50000000",
        "bloquant": true,
        "message_echec": "Le montant dépasse 50 M MAD : ce dispositif est réservé aux TPME. Consultez le dispositif Grandes Entreprises auprès des CRI."
      },
      {
        "id": "autofinancement",
        "label": "Apport en fonds propres ≥ 10% du montant projet",
        "type": "boolean",
        "champ": "autofinancement_ok",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Un apport minimum de 10% en fonds propres est exigé. Ce point est à clarifier avec votre conseiller financier."
      },
      {
        "id": "emplois_prevus",
        "label": "Création d''emplois permanents prévue (CDI ≥ 18 mois, déclarés CNSS)",
        "type": "enum_excludes",
        "champ": "emplois_prevus",
        "valeurs": ["0"],
        "bloquant": false,
        "message_echec": "La prime emploi est calculée sur le nombre d''emplois CDI créés. Aucun emploi prévu = prime emploi nulle (mais les autres primes restent accessibles)."
      },
      {
        "id": "situation_administrative",
        "label": "Situation fiscale et CNSS régulière",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "La régularité fiscale et CNSS est requise pour déposer le dossier auprès du CRI."
      },
      {
        "id": "capital_independant",
        "label": "Capital non détenu à plus de 25% par une société dont le CA > 200 M MAD",
        "type": "boolean",
        "champ": "capital_independant",
        "valeur": true,
        "bloquant": true,
        "message_echec": "Une grande entreprise (CA > 200 M MAD) ne doit pas détenir plus de 25% de votre capital."
      },
      {
        "id": "secteur_exclu",
        "label": "Secteur non exclu du dispositif",
        "type": "enum_excludes",
        "champ": "secteur",
        "valeurs": ["alcool_tabac", "immobilier_residentiel"],
        "bloquant": true,
        "message_echec": "Votre secteur figure parmi les activités exclues (alcool/tabac, immobilier résidentiel pur). Vérifiez les arrêtés n°3-51-25 et 3-52-25 (BO n°7454, 06/11/2025)."
      },
      {
        "id": "prime_territoriale",
        "label": "Province éligible à la prime territoriale",
        "type": "boolean",
        "champ": "province_eligible_territoriale",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Votre région contient des provinces exclues de la prime territoriale (ex : Casablanca, Rabat, Tanger, Marrakech). Les primes emploi et secteur prioritaire restent accessibles. Vérifiez auprès de votre CRI."
      }
    ]
  }',
  '["Business plan complet", "Prévisionnel financier 3 à 5 ans", "Plan de création d''emplois (postes, contrats CDI, déclarations CNSS)", "Plan de financement du projet", "Statuts de la société", "Attestation de régularité fiscale (DGI)", "Attestation de régularité CNSS", "Relevé d''identité bancaire"]',
  '3 à 6 mois (instruction CRI + Convention d''investissement)',
  'https://www.cri-invest.ma',
  '2026-06-01',
  true
),

-- ============================================================
-- 2. MOWAKABA (Maroc PME)
-- ============================================================
(
  'mowakaba',
  'MOWAKABA — Digitalisation des TPE/PME',
  'Maroc PME',
  'Subvention digitalisation (jusqu''à 90% du coût hors taxes du projet)',
  500000, 90,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "statut_juridique",
        "label": "Entreprise formellement constituée (SARL ou SA)",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["SARL", "SA"],
        "bloquant": true,
        "message_echec": "MOWAKABA est réservé aux TPE/PME formellement constituées (SARL, SA)."
      },
      {
        "id": "type_projet_digital",
        "label": "Projet de digitalisation",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["digitalisation"],
        "bloquant": true,
        "message_echec": "MOWAKABA finance exclusivement des projets de digitalisation (ERP, logiciel de gestion, caisse enregistreuse, e-commerce, etc.)."
      },
      {
        "id": "situation_administrative",
        "label": "Situation fiscale et CNSS régulière",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "La régularité fiscale et CNSS est requise pour déposer le dossier MOWAKABA."
      },
      {
        "id": "ca_max",
        "label": "CA annuel < 200 M MAD (critère PME)",
        "type": "range",
        "champ": "ca_annuel",
        "min": null,
        "max": "199999999",
        "bloquant": false,
        "message_echec": "Le programme MOWAKABA cible les TPE et PME (CA < 200 M MAD). Au-delà, contactez Maroc PME pour vérifier votre éligibilité."
      },
      {
        "id": "secteur_ok",
        "label": "Secteur éligible (hors alcool/tabac/immobilier résidentiel)",
        "type": "enum_excludes",
        "champ": "secteur",
        "valeurs": ["alcool_tabac", "immobilier_residentiel"],
        "bloquant": false,
        "message_echec": "Certains secteurs peuvent être exclus du catalogue MOWAKABA. Vérifiez sur marocpme.gov.ma."
      }
    ]
  }',
  '["Devis d''un prestataire agréé du catalogue Maroc PME", "Fiche projet (description de la solution, impacts attendus)", "Dossier administratif de l''entreprise (RC, patente, statuts)", "Attestation de régularité fiscale", "Attestation de régularité CNSS", "RIB de l''entreprise"]',
  '1 à 3 mois après dépôt du dossier complet',
  'https://www.marocpme.gov.ma',
  '2026-06-01',
  true
),

-- ============================================================
-- 3. ISTITMAR (Maroc PME)
-- ============================================================
(
  'istitmar',
  'ISTITMAR — Prime à l''investissement matériel et immatériel',
  'Maroc PME',
  'Prime à l''investissement (matériel et immatériel, taux variable selon le projet)',
  2000000, 20,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "statut_juridique",
        "label": "Entreprise formellement constituée (SARL ou SA)",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["SARL", "SA"],
        "bloquant": true,
        "message_echec": "ISTITMAR est réservé aux TPE/PME formellement constituées."
      },
      {
        "id": "type_projet",
        "label": "Projet d''investissement de croissance (extension, équipement, etc.)",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["creation", "extension"],
        "bloquant": false,
        "message_echec": "ISTITMAR cible prioritairement les projets d''investissement matériel ou immatériel de croissance."
      },
      {
        "id": "montant_min",
        "label": "Projet d''investissement significatif (≥ 100 K MAD)",
        "type": "range",
        "champ": "montant_projet",
        "min": "100000",
        "max": null,
        "bloquant": false,
        "message_echec": "Un investissement minimum est généralement requis pour accéder au programme ISTITMAR."
      },
      {
        "id": "situation_administrative",
        "label": "Situation fiscale et CNSS régulière",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "La régularité fiscale et CNSS est requise."
      },
      {
        "id": "ca_max",
        "label": "CA annuel < 200 M MAD (critère TPE/PME)",
        "type": "range",
        "champ": "ca_annuel",
        "min": null,
        "max": "199999999",
        "bloquant": false,
        "message_echec": "ISTITMAR cible les TPE et PME (CA < 200 M MAD)."
      }
    ]
  }',
  '["Business plan avec plan de croissance", "Devis des équipements ou investissements prévus", "Prévisionnel financier", "Statuts de la société", "Registre de commerce", "Attestation fiscale", "Attestation CNSS", "RIB"]',
  '2 à 4 mois',
  'https://www.marocpme.gov.ma',
  '2026-06-01',
  true
),

-- ============================================================
-- 4. INNOV INVEST
-- ============================================================
(
  'innov-invest',
  'Fonds Innov Invest — Amorçage startups innovantes',
  'Caisse Centrale de Garantie (CCG) / Ecosystème innovation',
  'Subventions et prêts d''honneur pour startups innovantes (amorçage)',
  500000, 75,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "type_projet_innovation",
        "label": "Projet innovant (tech ou usage innovant disruptif)",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["innovation"],
        "bloquant": true,
        "message_echec": "Innov Invest cible exclusivement les startups et projets à forte composante innovante (tech, usage, modèle économique innovant)."
      },
      {
        "id": "entreprise_jeune",
        "label": "Entreprise en phase d''amorçage (≤ 5 ans)",
        "type": "range",
        "champ": "annee_creation",
        "min": "2020",
        "max": null,
        "bloquant": false,
        "message_echec": "Innov Invest privilégie les startups en phase d''amorçage (généralement moins de 5 ans d''existence)."
      },
      {
        "id": "structure_labellisee",
        "label": "Passage par une structure labellisée (incubateur, accélérateur agréé)",
        "type": "boolean",
        "champ": "accompagnement_structure",
        "valeur": true,
        "bloquant": false,
        "message_echec": "L''accès au Fonds Innov Invest passe généralement par une structure labellisée (incubateur, CRI innovation, UM6P Ventures, etc.)."
      },
      {
        "id": "secteur_tech",
        "label": "Secteur à fort potentiel d''innovation",
        "type": "enum_includes",
        "champ": "secteur",
        "valeurs": ["TIC", "industrie", "agro", "economie_verte", "services"],
        "bloquant": false,
        "message_echec": "Les secteurs technologiques et à fort impact (TIC, agro-tech, green tech, industrie innovante) sont prioritaires."
      }
    ]
  }',
  '["Pitch deck (15 slides max)", "Business plan axé innovation et traction", "Description technique de la solution", "Profil et CV de l''équipe fondatrice", "Lettre de recommandation ou accord de principe d''une structure labellisée", "Preuves de traction le cas échéant (utilisateurs, MoU, PoC)"]',
  '2 à 5 mois (selon structure labellisée)',
  'https://www.ccg.ma',
  '2026-06-01',
  true
),

-- ============================================================
-- 5. DIGITAL PME (ADD)
-- ============================================================
(
  'digital-pme',
  'Digital PME — Transformation numérique des entreprises',
  'Agence de Développement du Digital (ADD)',
  'Accompagnement et cofinancement de la transformation numérique',
  300000, 50,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "statut_juridique",
        "label": "Entreprise formellement constituée",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["SARL", "SA"],
        "bloquant": false,
        "message_echec": "Le programme Digital PME cible principalement les entreprises formellement constituées."
      },
      {
        "id": "type_projet_digital",
        "label": "Projet de transformation numérique",
        "type": "enum_includes",
        "champ": "type_projet",
        "valeurs": ["digitalisation", "innovation"],
        "bloquant": true,
        "message_echec": "Digital PME finance uniquement les projets de transformation numérique ou d''innovation digitale."
      },
      {
        "id": "ca_max",
        "label": "TPE/PME (CA < 200 M MAD)",
        "type": "range",
        "champ": "ca_annuel",
        "min": null,
        "max": "199999999",
        "bloquant": false,
        "message_echec": "Le programme cible les TPE et PME (CA < 200 M MAD)."
      },
      {
        "id": "situation_administrative",
        "label": "Situation fiscale et CNSS régulière",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "La régularité administrative est requise pour le dossier ADD."
      }
    ]
  }',
  '["Formulaire de candidature ADD (disponible sur add.gov.ma)", "Diagnostic digital de l''entreprise", "Description du projet de transformation numérique", "Devis des prestataires", "Statuts et RC de l''entreprise", "Attestation fiscale et CNSS"]',
  '1 à 4 mois',
  'https://www.add.gov.ma',
  '2026-06-01',
  true
)

on conflict (slug) do update set
  nom                   = excluded.nom,
  organisme             = excluded.organisme,
  type_aide             = excluded.type_aide,
  montant_max           = excluded.montant_max,
  taux                  = excluded.taux,
  regles                = excluded.regles,
  documents_requis      = excluded.documents_requis,
  delai_indicatif       = excluded.delai_indicatif,
  lien_officiel         = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification,
  actif                 = excluded.actif;
