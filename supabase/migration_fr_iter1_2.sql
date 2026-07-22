-- ============================================================
-- SEED France — Itérations 1 & 2
-- Catégories : creation_reprise (5) + innovation_rd / fiscal_social (7)
-- À exécuter APRÈS migration_socle_v2.sql
-- ============================================================
-- IMPORTANT : Tous les seuils, taux, plafonds et conditions sont INDICATIFS.
-- Ils ont été établis à partir de sources secondaires :
--   ACRE/ARCE  → urssaf.fr, francetravail.fr
--   Prêt d'honneur → initiative-france.fr, reseau-entreprendre.fr
--   Garantie BPI → bpifrance.fr
--   JEI → bofip.impots.gouv.fr, urssaf.fr
--   BFT Emergence, i-Demo, Aide Deeptech, PIRD, i-Lab → bpifrance.fr
--   France 2030 → france2030.gouv.fr
-- VÉRIFIEZ SYSTÉMATIQUEMENT LES CONDITIONS OFFICIELLES AVANT MISE EN PRODUCTION.
-- Les seuils d'annee_creation doivent être mis à jour chaque année (ex: 2025+1=2026).
-- ============================================================

-- ============================================================
-- ITÉRATION 1 — CRÉATION / REPRISE
-- ============================================================

-- 1. ACRE
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'acre',
  'ACRE — Aide à la Création ou Reprise d''Entreprise',
  'URSSAF',
  'exoneration_sociale',
  'creation_reprise', array['createur', 'auto_entrepreneur'],
  null, null,
  'FR', 'EUR', 2025, false, false,
  true, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "entreprise_recente",
        "label": "Entreprise créée ou en cours de création (création en 2025 ou 2026)",
        "type": "range",
        "champ": "annee_creation",
        "min": "2025",
        "max": null,
        "bloquant": false,
        "message_echec": "L'ACRE s'applique lors de la création ou reprise d'entreprise. Si votre entreprise a plus d'1 an, vous n'êtes probablement plus éligible. Vérifiez votre date de création exacte sur urssaf.fr. (Seuil indicatif : à recalculer chaque année = année en cours − 1.)"
      },
      {
        "id": "micro_conditions",
        "label": "Pour les micro-entrepreneurs : justifier d'une situation éligible (demandeur d'emploi, RSA, ASS, < 26 ans, etc.)",
        "type": "enum_includes",
        "champ": "situation_personnelle",
        "valeurs": ["demandeur_emploi", "beneficiaire_minima", "autre"],
        "bloquant": false,
        "message_echec": "Pour les micro-entrepreneurs, l'ACRE est soumise à conditions (demandeur d'emploi ARE, bénéficiaire RSA/ASS/ATA, moins de 26 ans, moins de 30 ans non indemnisé, etc.). Pour les sociétés (SAS, SARL, SA…), l'exonération est automatique sans condition de statut lors de la création ou reprise."
      },
      {
        "id": "non_acre_anterieure",
        "label": "Ne pas avoir bénéficié de l'ACRE dans les 3 dernières années",
        "type": "boolean",
        "champ": "aide_anterieure",
        "valeur": false,
        "bloquant": false,
        "message_echec": "Il n'est pas possible de bénéficier de l'ACRE deux fois dans un délai de 3 ans. Si vous avez déjà perçu ce dispositif depuis 2022, vérifiez votre éligibilité auprès de votre URSSAF."
      },
      {
        "id": "situation_fiscale",
        "label": "Situation fiscale et sociale à jour",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "L'ACRE est gérée par l'URSSAF : une situation de cotisations sociales irrégulière peut bloquer le traitement de votre demande."
      }
    ]
  }$json$::jsonb,
  '["Pour les auto-entrepreneurs / EI : formulaire de demande d''ACRE (cerfa 13584*02) à déposer à l''URSSAF dans les 45 jours suivant le début d''activité", "Pour les sociétés (SAS, SARL, etc.) : l''exonération est automatique, aucun formulaire requis", "Justificatif de la situation éligible le cas échéant (attestation Pôle Emploi, justificatif RSA…)"]',
  'Immédiat (exonération dès le début d''activité)',
  'https://www.urssaf.fr/portail/home/independant/je-cree-mon-entreprise/exonerations-et-dispositifs-daid/laide-a-la-creation-ou-reprise-d.html',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;


-- 2. ARCE
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'arce',
  'ARCE — Aide à la Reprise ou à la Création d''Entreprise (France Travail)',
  'France Travail (Pôle Emploi)',
  'capitalisation_droits',
  'creation_reprise', array['createur'],
  null, 60,
  'FR', 'EUR', 2025, false, false,
  true, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "demandeur_emploi_indemnise",
        "label": "Être demandeur d'emploi indemnisé (bénéficiaire de l'ARE au moment de la création)",
        "type": "enum_includes",
        "champ": "situation_personnelle",
        "valeurs": ["demandeur_emploi"],
        "bloquant": true,
        "message_echec": "L'ARCE est strictement réservée aux demandeurs d'emploi indemnisés (bénéficiaires de l'Allocation de Retour à l'Emploi — ARE). Les créateurs salariés, dirigeants ou sans droits ARE ne peuvent pas en bénéficier."
      },
      {
        "id": "creation_effective",
        "label": "Création ou reprise d'entreprise effective (immatriculation récente)",
        "type": "range",
        "champ": "annee_creation",
        "min": "2025",
        "max": null,
        "bloquant": false,
        "message_echec": "L'ARCE est versée lors de la création ou reprise d'entreprise. La demande doit être faite à France Travail dès l'immatriculation."
      },
      {
        "id": "acre_obtenu",
        "label": "Avoir obtenu l'ACRE (condition préalable à l'ARCE)",
        "type": "boolean",
        "champ": "acre_confirme",
        "valeur": true,
        "bloquant": false,
        "message_echec": "L'ARCE nécessite d'avoir obtenu l'ACRE au préalable. Si vous êtes éligible à l'ACRE, vous pouvez enchaîner la demande d'ARCE auprès de France Travail."
      },
      {
        "id": "choix_arce_vs_are",
        "label": "Choix ARCE vs maintien mensuel ARE : décision financière importante à analyser",
        "type": "boolean",
        "champ": "arce_vs_are_confirme",
        "valeur": true,
        "bloquant": false,
        "message_echec": "CHOIX IMPORTANT — ARCE et maintien mensuel de l'ARE sont incompatibles. ARCE = vous percevez 60% de vos droits restants en 2 versements (création + 6 mois). Maintien ARE = vous continuez à percevoir votre allocation mensuelle jusqu'à ce que vos revenus d'activité atteignent votre ARE. Le maintien mensuel est souvent plus avantageux si l'entreprise monte progressivement en charge. Consultez un conseiller France Travail avant de choisir."
      }
    ]
  }$json$::jsonb,
  '["Attestation d''inscription à France Travail (notification de droits ARE)", "Justificatif de création / reprise d''entreprise (Kbis, extrait INPI, certificat d''inscription)", "Formulaire de demande d''ARCE (disponible sur francetravail.fr)", "Justificatif d''obtention de l''ACRE (si applicable)"]',
  '2 à 4 semaines après la demande',
  'https://www.francetravail.fr/candidat/mes-aides-et-mes-droits/les-aides/les-aides-et-exonerations-pou/larce.html',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;


-- 3. Prêt d'honneur
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'pret-honneur',
  'Prêt d''honneur (Initiative France / Réseau Entreprendre)',
  'Initiative France / Réseau Entreprendre',
  'pret_honneur',
  'creation_reprise', array['createur'],
  90000, null,
  'FR', 'EUR', null, false, false,
  true, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "projet_creation",
        "label": "Projet de création, reprise ou développement d'entreprise",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["creation_amorcage", "innovation_produit", "rd_verrous", "dev_commercial"],
        "bloquant": false,
        "message_echec": "Le prêt d'honneur est accordé aux porteurs de projets de création, reprise ou développement d'entreprise. Un projet exclusivement commercial sans ambition de croissance est moins prioritaire."
      },
      {
        "id": "apport_cofinancement",
        "label": "Apport personnel ou fonds propres disponibles (effet levier bancaire attendu)",
        "type": "boolean",
        "champ": "cofinancement_ok",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Le prêt d'honneur est accordé à la personne physique et sert d'effet de levier pour obtenir un prêt bancaire. Les réseaux attendent généralement un apport personnel et un plan de financement bouclé."
      },
      {
        "id": "comite_agrement",
        "label": "Passage devant un comité d'agrément bénévole (Initiative France ou Réseau Entreprendre)",
        "type": "boolean",
        "champ": "comite_agrement_ok",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Le prêt d'honneur n'est pas accordé automatiquement. Votre dossier sera présenté devant un comité d'entrepreneurs bénévoles qui évalueront votre projet, votre personne et votre plan financier. L'obtention n'est pas garantie — préparez un pitch solide."
      }
    ]
  }$json$::jsonb,
  '["Business plan complet (executive summary + développement + annexes)", "Prévisionnel financier 3 ans (compte de résultat, bilan, plan de trésorerie)", "Plan de financement global du projet", "CV du porteur de projet", "Extrait Kbis ou projet de statuts (si en cours de création)"]',
  '4 à 8 semaines (instruction + comité)',
  'https://www.initiative-france.fr',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;


-- 4. Garantie Création Bpifrance
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'garantie-creation-bpi',
  'Garantie Création (Bpifrance)',
  'Bpifrance',
  'garantie',
  'creation_reprise', array['createur', 'tpe'],
  null, 60,
  'FR', 'EUR', null, false, false,
  true, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "entreprise_moins_3ans",
        "label": "Entreprise créée depuis moins de 3 ans ou projet de reprise",
        "type": "range",
        "champ": "annee_creation",
        "min": "2023",
        "max": null,
        "bloquant": false,
        "message_echec": "La Garantie Création Bpifrance cible les entreprises de moins de 3 ans et les reprises d'entreprise. (Seuil indicatif : année en cours − 3.)"
      },
      {
        "id": "pret_bancaire_prevu",
        "label": "Prêt bancaire professionnel en cours de négociation ou prévu",
        "type": "boolean",
        "champ": "pret_bancaire_prevu",
        "valeur": true,
        "bloquant": false,
        "message_echec": "La Garantie Création couvre 50 à 60% d'un prêt bancaire professionnel. Elle ne se substitue pas au prêt : votre banque doit d'abord accepter de financer le projet (la garantie rassure la banque pour accorder le prêt)."
      },
      {
        "id": "depenses_avant_decaissement",
        "label": "Garantie à mettre en place avant le décaissement du prêt bancaire",
        "type": "boolean",
        "champ": "depenses_engagees",
        "valeur": false,
        "bloquant": false,
        "message_echec": "La garantie Bpifrance doit être accordée avant le décaissement du prêt par la banque. Si le prêt a déjà été versé, la garantie ne peut plus être mise en place a posteriori."
      },
      {
        "id": "situation_fiscale",
        "label": "Obligations fiscales et sociales à jour",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "Bpifrance exige que l'entreprise soit à jour de ses obligations fiscales et sociales."
      }
    ]
  }$json$::jsonb,
  '["Dossier bancaire (demande de prêt avec détail des besoins financés)", "Business plan et prévisionnel financier", "Plan de financement global", "Lettre d''accord de principe de la banque (si disponible)", "Extrait Kbis ou statuts"]',
  '2 à 4 semaines (instruction en parallèle du dossier bancaire)',
  'https://www.bpifrance.fr/nos-solutions/garanties',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;


-- 5. Accompagnement création
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'accompagnement-creation',
  'Parcours d''accompagnement à la création (BGE, CCI, BGE, ADIE)',
  'BGE / CCI / Réseau Entreprendre / ADIE (opérateurs régionaux)',
  'accompagnement',
  'creation_reprise', array['createur', 'auto_entrepreneur'],
  null, null,
  'FR', 'EUR', null, false, false,
  true, true,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "projet_porteur",
        "label": "Porteur d'un projet de création, reprise ou structuration d'entreprise",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["creation_amorcage", "innovation_produit", "rd_verrous", "dev_commercial", "autre"],
        "bloquant": false,
        "message_echec": "Les parcours d'accompagnement s'adressent aux porteurs de projets de création ou de reprise d'entreprise."
      },
      {
        "id": "eligibilite_operateur_local",
        "label": "Éligibilité confirmée auprès de l'opérateur local (BGE, CCI, Réseau Entreprendre, ADIE selon votre région et votre profil)",
        "type": "boolean",
        "champ": "accompagnement_region_eligible",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Les parcours d'accompagnement varient significativement selon les régions et les opérateurs. Certains programmes sont réservés aux demandeurs d'emploi, d'autres aux porteurs en phase d'amorçage, d'autres encore aux micro-entrepreneurs. Contactez votre CCI, BGE ou ADI locale pour identifier l'accompagnement le plus adapté à votre situation."
      }
    ]
  }$json$::jsonb,
  '["Présentation du projet (pitch, business model canvas ou document libre)", "CV du porteur de projet", "Motivations et contexte de la création (lettre courte)"]',
  'Démarrage sous 2 à 4 semaines selon l''opérateur',
  'https://entreprendre.service-public.fr/vosdroits/F23282',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;


-- ============================================================
-- ITÉRATION 2 — INNOVATION, R&D, FISCAL
-- ============================================================

-- 6. JEI (fiscal_social)
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'jei',
  'JEI — Jeune Entreprise Innovante (JEI / JEI Croissance / JEI à Impact)',
  'DGFiP / URSSAF',
  'exoneration_sociale',
  'fiscal_social', array['tpe', 'pme'],
  null, null,
  'FR', 'EUR', 2025, false, true,
  true, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "age_entreprise_8ans",
        "label": "Entreprise de moins de 8 ans (créée depuis 2018 au plus tôt pour 2026)",
        "type": "range",
        "champ": "annee_creation",
        "min": "2018",
        "max": null,
        "bloquant": true,
        "message_echec": "Le statut JEI est réservé aux entreprises de moins de 8 ans à la clôture de l'exercice (donc créées en 2018 ou après pour 2026). Ce seuil se décale d'un an à chaque exercice — à vérifier annuellement. Source : BOFiP."
      },
      {
        "id": "effectif_pme",
        "label": "PME au sens communautaire (effectif < 250 salariés, CA < 50 M€ ou bilan < 43 M€)",
        "type": "enum_includes",
        "champ": "effectif",
        "valeurs": ["<10", "10-49", "50-249"],
        "bloquant": true,
        "message_echec": "Le statut JEI est réservé aux PME : effectif < 250 salariés ET (CA annuel < 50 M€ OU total bilan < 43 M€). Les ETI et grandes entreprises sont exclues."
      },
      {
        "id": "depenses_rd_15pct",
        "label": "Dépenses de R&D ≥ 15% des charges fiscalement déductibles",
        "type": "enum_includes",
        "champ": "depenses_rd_15pct",
        "valeurs": ["oui"],
        "bloquant": true,
        "message_echec": "Le critère clé du statut JEI : les dépenses de R&D (au sens CIR — salaires chercheurs, amortissements équipements R&D, sous-traitance agréée, brevets…) doivent représenter au moins 15% des charges totales de l'exercice. C'est souvent le critère le plus difficile à atteindre — à calculer impérativement avec votre expert-comptable."
      },
      {
        "id": "regime_fiscal_eligible",
        "label": "Soumise à l'IS ou à l'IR régime réel (micro exclue)",
        "type": "enum_includes",
        "champ": "regime_fiscal",
        "valeurs": ["IS", "IR_reel"],
        "bloquant": false,
        "message_echec": "Le statut JEI est accessible aux entreprises soumises à l'IS ou à l'IR régime réel. Les auto-entrepreneurs et micro-entreprises en régime micro sont exclus de ce dispositif."
      },
      {
        "id": "capital_personnes_physiques",
        "label": "Capital détenu majoritairement par des personnes physiques (ou d'autres JEI, fonds d'amorçage agréés)",
        "type": "boolean",
        "champ": "capital_independant",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Le statut JEI exige que plus de 50% du capital soit détenu par des personnes physiques, d'autres JEI, des associations ou fondations R&D, ou certains fonds d'amorçage agréés. Une détention majoritaire par une grande entreprise invalide le statut."
      }
    ]
  }$json$::jsonb,
  '["Calcul détaillé des dépenses de R&D (feuilles de temps, amortissements, sous-traitance)", "Attestation expert-comptable ou CAC sur le ratio 15%", "Déclaration URSSAF (exonérations sur cotisations patronales R&D)", "Formulaire IS (cases JEI si IS) — option d''exonération IS/IR à cocher", "Répartition du capital (tableaux actionnariat)"]',
  'Récurrent — statut à maintenir chaque exercice (vérification annuelle du ratio 15%)',
  'https://bofip.impots.gouv.fr/bofip/4758-PGP.html/identifiant=BOI-BIC-CHAMP-80-20',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;


-- 7. Bourse French Tech Emergence
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'bft-emergence',
  'Bourse French Tech Emergence (deeptech amorçage)',
  'Bpifrance',
  'subvention',
  'creation_reprise', array['createur', 'tpe'],
  600000, 70,
  'FR', 'EUR', null, false, false,
  true, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "deeptech_verrou",
        "label": "Technologie issue de travaux de recherche ou présentant un verrou scientifique/technique majeur",
        "type": "boolean",
        "champ": "techno_recherche",
        "valeur": true,
        "bloquant": true,
        "message_echec": "La Bourse French Tech Emergence cible exclusivement les projets deeptech : technologies issues de la recherche publique (labo, thèse, CNRS, CEA, INRAE…) ou privée, présentant des verrous scientifiques ou techniques non résolus dans l'état de l'art. Une innovation produit classique sans verrou relève de la Bourse French Tech standard (50 K€)."
      },
      {
        "id": "depenses_non_engagees",
        "label": "Aucune dépense engagée sur le projet avant le dépôt du dossier",
        "type": "boolean",
        "champ": "depenses_engagees",
        "valeur": false,
        "bloquant": true,
        "message_echec": "BLOQUANT — Règle Bpifrance : seules les dépenses postérieures à la date de dépôt du dossier sont éligibles. Des dépenses déjà engagées rendent la demande irrecevable."
      },
      {
        "id": "budget_compatible_emergence",
        "label": "Budget projet compatible avec la Bourse Emergence (200 K€ à 2 M€)",
        "type": "enum_includes",
        "champ": "budget_projet",
        "valeurs": ["200K-600K", "600K-2M"],
        "bloquant": false,
        "message_echec": "La Bourse Emergence couvre jusqu'à 600 K€ (70% max des dépenses). Pour des projets > 2 M€, l'Aide Deeptech ou i-Demo sont plus adaptés. Pour des projets < 200 K€, la Bourse French Tech standard (50 K€) est l'outil approprié."
      },
      {
        "id": "entreprise_jeune",
        "label": "Entreprise de moins de 5 ans ou en cours de création",
        "type": "range",
        "champ": "annee_creation",
        "min": "2021",
        "max": null,
        "bloquant": false,
        "message_echec": "La Bourse Emergence cible les jeunes entreprises deeptech en phase d'amorçage (< 5 ans)."
      }
    ]
  }$json$::jsonb,
  '["Présentation deeptech (état de l''art, verrous scientifiques, plan de dérisquage)", "Lettre d''intention ou convention avec le laboratoire d''origine (si applicable)", "Budget prévisionnel détaillé", "CV équipe fondatrice (dont chercheurs et doctorants)", "Plan de financement"]',
  '3 à 5 mois (instruction Bpifrance)',
  'https://www.bpifrance.fr/nos-solutions/bourse-french-tech',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;


-- 8. i-Demo
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'i-demo',
  'i-Demo — R&D collaborative et pré-industrialisation (France 2030)',
  'Bpifrance / ADEME — France 2030',
  'subvention',
  'financement_innovation', array['pme', 'eti'],
  null, 45,
  'FR', 'EUR', null, false, false,
  false, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "depenses_non_engagees",
        "label": "Aucune dépense engagée avant le dépôt de candidature",
        "type": "boolean",
        "champ": "depenses_engagees",
        "valeur": false,
        "bloquant": true,
        "message_echec": "BLOQUANT — Règle Bpifrance/France 2030 : les dépenses engagées avant le dépôt sont inéligibles."
      },
      {
        "id": "nature_rd_collaborative",
        "label": "Projet de R&D collaborative ou de pré-industrialisation dans une thématique France 2030",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["rd_verrous", "innovation_produit"],
        "bloquant": false,
        "message_echec": "i-Demo finance des projets de R&D collaborative (avec labo ou partenaires industriels) et de pré-industrialisation dans les transitions énergétique, numérique et écologique."
      },
      {
        "id": "budget_significatif",
        "label": "Budget projet > 2 M€ (taille compatible avec i-Demo)",
        "type": "enum_includes",
        "champ": "budget_projet",
        "valeurs": ["2M-5M", ">5M"],
        "bloquant": false,
        "message_echec": "i-Demo cible des projets de taille significative (typiquement > 2 M€ de dépenses R&D). Pour des projets plus petits, ADI Bpifrance ou la Bourse Emergence sont plus adaptés."
      },
      {
        "id": "partenariat_rd",
        "label": "Partenariat avec un laboratoire académique ou un industriel tiers (projet collaboratif)",
        "type": "boolean",
        "champ": "partenariat_rd",
        "valeur": true,
        "bloquant": false,
        "message_echec": "i-Demo privilégie les consortiums : laboratoire académique + industriels. Un projet solo peut être admis mais sera moins compétitif. Un partenariat formel (convention, lettre d''intention) est attendu."
      }
    ]
  }$json$::jsonb,
  '["Dossier de candidature i-Demo (formulaire Bpifrance)", "Description technique du projet (état de l''art, verrous, TRL, plan de travail)", "Lettres d''intention des partenaires du consortium", "Prévisionnel financier et plan de financement", "Annexes financières des partenaires (bilans, comptes de résultat)"]',
  '4 à 6 mois (par vague — consulter france2030.gouv.fr)',
  'https://www.bpifrance.fr/nos-solutions/innovation',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;

update dispositifs set prochaine_echeance = '2026-10-01' where slug = 'i-demo';


-- 9. Aide Deeptech
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'aide-deeptech',
  'Aide Deeptech (Bpifrance)',
  'Bpifrance',
  'avance_remboursable',
  'financement_innovation', array['tpe', 'pme', 'eti'],
  2000000, 50,
  'FR', 'EUR', null, false, false,
  true, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "techno_rupture",
        "label": "Innovation de rupture issue de la recherche — verrous scientifiques ou techniques majeurs",
        "type": "boolean",
        "champ": "techno_recherche",
        "valeur": true,
        "bloquant": true,
        "message_echec": "L'Aide Deeptech est exclusivement réservée aux projets présentant une innovation technologique de rupture, issue de travaux de recherche (labo, brevet, thèse). Une innovation produit incrémentale relève de l'ADI Bpifrance."
      },
      {
        "id": "depenses_non_engagees",
        "label": "Aucune dépense engagée avant le dépôt",
        "type": "boolean",
        "champ": "depenses_engagees",
        "valeur": false,
        "bloquant": true,
        "message_echec": "BLOQUANT — Règle Bpifrance : les dépenses engagées avant le dépôt du dossier sont inéligibles."
      },
      {
        "id": "effectif_pme_eti",
        "label": "PME ou ETI innovante",
        "type": "enum_includes",
        "champ": "effectif",
        "valeurs": ["<10", "10-49", "50-249", "250+"],
        "bloquant": false,
        "message_echec": "L'Aide Deeptech cible les PME et ETI présentant un fort potentiel d'innovation de rupture."
      },
      {
        "id": "cofinancement",
        "label": "Capacité à cofinancer la part non couverte par Bpifrance",
        "type": "boolean",
        "champ": "cofinancement_ok",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Bpifrance couvre en général 50% des dépenses éligibles. Les 50% restants doivent être financés par l'entreprise (fonds propres, prêts, investisseurs)."
      }
    ]
  }$json$::jsonb,
  '["Dossier technique deeptech (état de l''art, verrous, TRL, roadmap)", "Budget détaillé du projet (dépenses internes + sous-traitance)", "Prévisionnel financier et plan de financement", "CV équipe (chercheurs, ingénieurs R&D)", "Annexes financières (bilans 3 ans ou prévisionnel si < 3 ans)"]',
  '3 à 6 mois (instruction Bpifrance)',
  'https://www.bpifrance.fr/nos-solutions/innovation',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;


-- 10. PIRD — Prêt Innovation R&D
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'pird',
  'PIRD — Prêt Innovation R&D (Bpifrance)',
  'Bpifrance',
  'pret',
  'financement_innovation', array['pme'],
  null, null,
  'FR', 'EUR', null, false, false,
  true, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "effectif_pme",
        "label": "PME au sens communautaire (effectif < 250 salariés)",
        "type": "enum_includes",
        "champ": "effectif",
        "valeurs": ["<10", "10-49", "50-249"],
        "bloquant": true,
        "message_echec": "Le Prêt Innovation R&D Bpifrance est réservé aux PME innovantes (< 250 salariés)."
      },
      {
        "id": "nature_innovation_technologique",
        "label": "Projet d'innovation technologique qualifié (incrémentale ou de rupture)",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["rd_verrous", "innovation_produit"],
        "bloquant": false,
        "message_echec": "Le PIRD finance les projets d'innovation technologique (R&D produit, procédé, logiciel). Un projet purement commercial ou organisationnel sans contenu technique n'est pas éligible."
      },
      {
        "id": "situation_fiscale",
        "label": "Situation fiscale et sociale à jour",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "Bpifrance requiert que l'entreprise soit à jour de ses obligations fiscales et sociales."
      },
      {
        "id": "sante_financiere",
        "label": "Situation financière saine (fonds propres positifs, pas de procédure collective en cours)",
        "type": "boolean",
        "champ": "sante_financiere_ok",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Bpifrance vérifie la santé financière de l'entreprise avant d'accorder un prêt. Des fonds propres négatifs, une procédure de sauvegarde ou de redressement sont rédhibitoires."
      }
    ]
  }$json$::jsonb,
  '["Dossier technique du projet d''innovation (description, TRL, plan de développement)", "Prévisionnel financier 3 ans", "Bilans et comptes de résultat des 3 derniers exercices", "Plan de financement du projet"]',
  '2 à 4 mois (instruction Bpifrance)',
  'https://www.bpifrance.fr/nos-solutions/innovation',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;


-- 11. i-Lab
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'i-lab',
  'Concours i-Lab — création d''entreprises deeptech (Bpifrance / MESR)',
  'Bpifrance / Ministère de l''Enseignement Supérieur et de la Recherche',
  'subvention',
  'financement_innovation', array['createur', 'tpe'],
  450000, null,
  'FR', 'EUR', null, false, false,
  false, true,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "deeptech_recherche",
        "label": "Projet deeptech issu de la recherche — technologie de rupture avec verrou scientifique",
        "type": "boolean",
        "champ": "techno_recherche",
        "valeur": true,
        "bloquant": true,
        "message_echec": "i-Lab est le concours national de création d'entreprises deeptech. Seuls des projets issus de la recherche publique ou privée, présentant une rupture technologique majeure (brevet, verrou de fond, thèse…) sont retenus."
      },
      {
        "id": "entreprise_tres_jeune",
        "label": "Entreprise en cours de création ou très jeune (< 3 ans)",
        "type": "range",
        "champ": "annee_creation",
        "min": "2023",
        "max": null,
        "bloquant": false,
        "message_echec": "i-Lab cible principalement les porteurs de projets souhaitant créer leur entreprise deeptech, ou les entreprises très récentes (< 3 ans). Les entreprises plus matures peuvent postuler mais sont moins prioritaires."
      },
      {
        "id": "budget_coherent_ilab",
        "label": "Budget projet cohérent avec les plafonds i-Lab (< 2 M€ typiquement)",
        "type": "enum_includes",
        "champ": "budget_projet",
        "valeurs": ["<50K", "50K-200K", "200K-600K", "600K-2M"],
        "bloquant": false,
        "message_echec": "i-Lab finance jusqu'à 450 K€ (subvention + avance). Pour des projets > 2 M€, l'Aide Deeptech Bpifrance est plus adaptée."
      }
    ]
  }$json$::jsonb,
  '["Dossier de candidature i-Lab (formulaire Bpifrance/MESR — uniquement pendant les vagues)", "Description scientifique du projet (état de l''art, verrous, plan de validation)", "CV du porteur (parcours recherche, publications, brevets)", "Business plan et prévisionnel"]',
  '4 à 6 mois par vague (1 à 2 vagues par an)',
  'https://www.bpifrance.fr/nos-solutions/i-lab',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;

update dispositifs set prochaine_echeance = '2026-11-01' where slug = 'i-lab';


-- 12. France 2030 AAP (méta-dispositif)
insert into dispositifs (
  slug, nom, organisme, type_aide,
  categorie, public_cible, montant_max, taux,
  pays, devise, millesime, recurrent, recurrent_annuel,
  guichet_ouvert, soumis_de_minimis,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'france-2030-aap',
  'Appels à projets France 2030 — IA, cyber, santé, énergie, mobilité (SGPI)',
  'SGPI / Bpifrance / ADEME (opérateurs)',
  'subvention',
  'financement_innovation', array['pme', 'eti'],
  null, null,
  'FR', 'EUR', null, false, false,
  false, false,
  $json${
    "version": 1,
    "criteres": [
      {
        "id": "secteur_thematique",
        "label": "Projet dans une thématique France 2030 (IA, cyber, santé, énergie, mobilité, agroalimentaire, espace, culture…)",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["rd_verrous", "innovation_produit", "creation_amorcage"],
        "bloquant": false,
        "message_echec": "France 2030 concentre ses appels à projets sur des thématiques stratégiques. Un projet de développement commercial pur est moins compétitif. Vérifiez sur france2030.gouv.fr si votre thématique fait l'objet d'un AAP ouvert."
      },
      {
        "id": "budget_significatif",
        "label": "Budget projet de taille suffisante pour un AAP France 2030 (typiquement > 500 K€)",
        "type": "enum_includes",
        "champ": "budget_projet",
        "valeurs": ["600K-2M", "2M-5M", ">5M"],
        "bloquant": false,
        "message_echec": "Les AAP France 2030 ciblent généralement des projets ambitieux (> 500 K€ de dépenses). Pour des projets plus petits, les outils Bpifrance (Bourse, ADI, i-Lab) sont mieux adaptés."
      },
      {
        "id": "aap_ouvert",
        "label": "Appel à projets thématique ouvert et calendrier compatible",
        "type": "boolean",
        "champ": "vague_france_2030",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Des appels à projets thématiques France 2030 correspondent probablement à votre profil — les calendriers sont variables (2 à 4 AAP ouverts en permanence). Consultez france2030.gouv.fr ou la plateforme Bpifrance pour identifier l'AAP ouvert le plus pertinent et ses conditions spécifiques d'éligibilité."
      }
    ]
  }$json$::jsonb,
  '["Formulaire de candidature de l''AAP concerné (sur la plateforme Bpifrance ou de l''opérateur)", "Dossier technique complet (état de l''art, verrous, impact, plan de mise en œuvre)", "Annexes financières (bilans, prévisionnel, plan de financement)", "Lettres d''engagement des partenaires (si AAP collaboratif)"]',
  'Variable selon les AAP (de 3 à 9 mois — consultez france2030.gouv.fr)',
  'https://france2030.gouv.fr',
  '2026-06-01',
  true
) on conflict (slug) do update set
  nom = excluded.nom, organisme = excluded.organisme, type_aide = excluded.type_aide,
  categorie = excluded.categorie, public_cible = excluded.public_cible,
  montant_max = excluded.montant_max, taux = excluded.taux,
  millesime = excluded.millesime, recurrent_annuel = excluded.recurrent_annuel,
  guichet_ouvert = excluded.guichet_ouvert, soumis_de_minimis = excluded.soumis_de_minimis,
  regles = excluded.regles, documents_requis = excluded.documents_requis,
  delai_indicatif = excluded.delai_indicatif, lien_officiel = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification, actif = excluded.actif;
