-- =============================================================
-- Configuration documents_requis_generation — 6 dispositifs
-- Coller dans Supabase SQL Editor et exécuter en une fois
-- =============================================================

-- ─── 1. AWRASH 2 ─────────────────────────────────────────────
UPDATE dispositifs
SET documents_requis_generation = $json1${
  "version": "1.0",
  "coffre_fort_requis": [
    {
      "type_document": "rc",
      "label": "Registre de Commerce",
      "description": "Copie certifiée conforme, en cours de validité",
      "obligatoire": true,
      "condition": null
    },
    {
      "type_document": "attestation_cnsss",
      "label": "Attestation CNSS",
      "description": "Attestation d'immatriculation et de régularité des cotisations",
      "obligatoire": true,
      "condition": null
    }
  ],
  "documents_specifiques": [],
  "questions_specifiques": [],
  "documents_a_generer": [
    {
      "id": "lettre_presentation_awrash",
      "type_document": "lettre_presentation",
      "label": "Lettre de présentation du projet d'embauche",
      "description": "Présente votre entreprise, son projet de croissance et votre démarche de recrutement.",
      "format": "docx",
      "ordre": 1,
      "mode": "choix",
      "champs_requis": [
        { "id": "nom_entreprise",     "source": "nom_entreprise" },
        { "id": "secteur",            "source": "secteur" },
        { "id": "statut_juridique",   "source": "statut_juridique" },
        { "id": "effectif",           "source": "effectif" },
        { "id": "embauche_prevue_ma", "source": "embauche_prevue_ma" }
      ],
      "questions_contexte": [
        {
          "id": "projet_entreprise",
          "label": "Décrivez le projet de développement de l'entreprise qui justifie ce recrutement",
          "type": "textarea",
          "placeholder": "Ex : nous lançons une nouvelle ligne de production, nous ouvrons un 2ème point de vente...",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["lettre_presentation_awrash"]
        },
        {
          "id": "motif_recrutement",
          "label": "Pourquoi recrutez-vous maintenant ? Quel profil cherchez-vous ?",
          "type": "textarea",
          "placeholder": "Ex : croissance du carnet de commandes, départ à la retraite d'un collaborateur...",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["lettre_presentation_awrash"]
        }
      ],
      "validations": []
    }
  ]
}$json1$::jsonb
WHERE nom ILIKE '%awrash%';


-- ─── 2. IDMAJ ────────────────────────────────────────────────
UPDATE dispositifs
SET documents_requis_generation = $json2${
  "version": "1.0",
  "coffre_fort_requis": [
    {
      "type_document": "rc",
      "label": "Registre de Commerce",
      "description": "Copie certifiée conforme",
      "obligatoire": true,
      "condition": null
    }
  ],
  "documents_specifiques": [],
  "questions_specifiques": [
    {
      "id": "poste_cree",
      "label": "Intitulé du poste créé",
      "type": "text",
      "placeholder": "Ex : Comptable, Technicien de production...",
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["fiche_poste_idmaj"]
    },
    {
      "id": "niveau_diplome",
      "label": "Niveau de diplôme requis",
      "type": "select",
      "options": [
        { "value": "aucun",  "label": "Aucun diplôme requis" },
        { "value": "bac",    "label": "Bac" },
        { "value": "bac2",   "label": "Bac+2 (BTS / DUT)" },
        { "value": "bac3",   "label": "Bac+3 (Licence)" },
        { "value": "bac5",   "label": "Bac+5 (Master / Ingénieur)" }
      ],
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["fiche_poste_idmaj"]
    },
    {
      "id": "experience_requise",
      "label": "Expérience professionnelle requise",
      "type": "select",
      "options": [
        { "value": "aucune",  "label": "Aucune" },
        { "value": "1_2_ans", "label": "1 à 2 ans" },
        { "value": "3_5_ans", "label": "3 à 5 ans" },
        { "value": "plus_5",  "label": "Plus de 5 ans" }
      ],
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["fiche_poste_idmaj"]
    }
  ],
  "documents_a_generer": [
    {
      "id": "fiche_poste_idmaj",
      "type_document": "fiche_poste",
      "label": "Fiche de poste",
      "description": "Document décrivant les missions, compétences et conditions du poste créé dans le cadre d'IDMAJ.",
      "format": "docx",
      "ordre": 1,
      "mode": "choix",
      "champs_requis": [
        { "id": "nom_entreprise",     "source": "nom_entreprise" },
        { "id": "secteur",            "source": "secteur" },
        { "id": "effectif",           "source": "effectif" },
        { "id": "poste_cree",         "source": "poste_cree" },
        { "id": "niveau_diplome",     "source": "niveau_diplome" },
        { "id": "experience_requise", "source": "experience_requise" }
      ],
      "questions_contexte": [
        {
          "id": "missions_principales",
          "label": "Missions principales du poste (listez les tâches clés)",
          "type": "textarea",
          "placeholder": "Ex : - Tenir la comptabilité générale\n- Etablir les déclarations fiscales\n- Gérer la trésorerie...",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["fiche_poste_idmaj"]
        },
        {
          "id": "competences_requises",
          "label": "Compétences techniques et savoir-faire requis",
          "type": "textarea",
          "placeholder": "Ex : maîtrise de Sage, connaissance du droit social marocain...",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["fiche_poste_idmaj"]
        },
        {
          "id": "type_contrat",
          "label": "Type de contrat et conditions (CDI/CDD, horaires, lieu...)",
          "type": "text",
          "placeholder": "Ex : CDI, 44h/semaine, Casablanca",
          "obligatoire": false,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["fiche_poste_idmaj"]
        }
      ],
      "validations": []
    }
  ]
}$json2$::jsonb
WHERE nom ILIKE '%idmaj%';


-- ─── 3. TAEHIL ───────────────────────────────────────────────
UPDATE dispositifs
SET documents_requis_generation = $json3${
  "version": "1.0",
  "coffre_fort_requis": [
    {
      "type_document": "rc",
      "label": "Registre de Commerce",
      "obligatoire": true,
      "condition": null
    }
  ],
  "documents_specifiques": [],
  "questions_specifiques": [
    {
      "id": "type_formation",
      "label": "Type de formation",
      "type": "select",
      "options": [
        { "value": "technique",    "label": "Formation technique / métier" },
        { "value": "management",   "label": "Management / leadership" },
        { "value": "langues",      "label": "Langues étrangères" },
        { "value": "informatique", "label": "Informatique / numérique" },
        { "value": "securite",     "label": "Sécurité / HSE" }
      ],
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["descriptif_formation_taehil"]
    },
    {
      "id": "nb_beneficiaires",
      "label": "Nombre de bénéficiaires",
      "type": "number",
      "unite": "salariés",
      "placeholder": "Ex : 5",
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["descriptif_formation_taehil"]
    },
    {
      "id": "organisme_formation",
      "label": "Organisme de formation prestataire",
      "type": "text",
      "placeholder": "Nom de l'organisme",
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["descriptif_formation_taehil"]
    }
  ],
  "documents_a_generer": [
    {
      "id": "descriptif_formation_taehil",
      "type_document": "descriptif_formation",
      "label": "Descriptif du plan de formation",
      "description": "Document à compléter et à téléverser — plan de formation fourni par l'OFPPT ou l'organisme prestataire.",
      "format": "docx",
      "ordre": 1,
      "mode": "upload",
      "champs_requis": [],
      "questions_contexte": [],
      "validations": []
    }
  ]
}$json3$::jsonb
WHERE nom ILIKE '%taehil%';


-- ─── 4. TAHFIZ ───────────────────────────────────────────────
-- Validation bloquante : salaire_brut_mensuel <= 10 000 DH
-- Formulaire officiel ANAPEC à télécharger
UPDATE dispositifs
SET documents_requis_generation = $json4${
  "version": "1.0",
  "coffre_fort_requis": [
    {
      "type_document": "rc",
      "label": "Registre de Commerce",
      "obligatoire": true,
      "condition": null
    },
    {
      "type_document": "attestation_cnsss",
      "label": "Attestation CNSS",
      "description": "Attestation d'affiliation et de régularité",
      "obligatoire": true,
      "condition": null
    },
    {
      "type_document": "statuts",
      "label": "Statuts de la société",
      "description": "Dernière version certifiée conforme",
      "obligatoire": true,
      "condition": null
    }
  ],
  "documents_specifiques": [],
  "questions_specifiques": [
    {
      "id": "salaire_brut_mensuel",
      "label": "Salaire brut mensuel par poste créé",
      "type": "number",
      "unite": "DH/mois",
      "placeholder": "Ex : 5000",
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["lettre_engagement_tahfiz"]
    },
    {
      "id": "nb_postes",
      "label": "Nombre de postes à créer",
      "type": "number",
      "unite": "postes",
      "placeholder": "Ex : 3",
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["lettre_engagement_tahfiz"]
    }
  ],
  "documents_a_generer": [
    {
      "id": "lettre_engagement_tahfiz",
      "type_document": "lettre_engagement",
      "label": "Lettre d'engagement employeur",
      "description": "Lettre formelle d'engagement à maintenir les postes créés et à respecter les conditions TAHFIZ.",
      "format": "docx",
      "ordre": 1,
      "mode": "choix",
      "champs_requis": [
        { "id": "nom_entreprise",       "source": "nom_entreprise" },
        { "id": "statut_juridique",     "source": "statut_juridique" },
        { "id": "secteur",              "source": "secteur" },
        { "id": "effectif",             "source": "effectif" },
        { "id": "region",               "source": "region" },
        { "id": "salaire_brut_mensuel", "source": "salaire_brut_mensuel" },
        { "id": "nb_postes",            "source": "nb_postes" }
      ],
      "questions_contexte": [
        {
          "id": "nom_dirigeant",
          "label": "Nom et prénom du signataire (dirigeant / gérant)",
          "type": "text",
          "placeholder": "Ex : Mohamed Alami",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["lettre_engagement_tahfiz"]
        },
        {
          "id": "qualite_dirigeant",
          "label": "Qualité du signataire",
          "type": "text",
          "placeholder": "Ex : Gérant, PDG, Directeur Général...",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["lettre_engagement_tahfiz"]
        }
      ],
      "validations": [
        {
          "regle": "coherence_montants",
          "config": {
            "champ": "salaire_brut_mensuel",
            "max": 10000,
            "alerte": "TAHFIZ couvre uniquement les postes avec un salaire brut <= 10 000 DH/mois. Votre valeur ({valeur} DH) depasse ce plafond — corrigez le salaire pour continuer."
          }
        }
      ]
    }
  ]
}$json4$::jsonb
WHERE nom ILIKE '%tahfiz%';


-- ─── 5. DAMANE EXPRESS ───────────────────────────────────────
UPDATE dispositifs
SET documents_requis_generation = $json5${
  "version": "1.0",
  "coffre_fort_requis": [
    {
      "type_document": "cin_dirigeant",
      "label": "CIN du gérant",
      "description": "Copie recto-verso de la carte d'identité nationale",
      "obligatoire": true,
      "condition": null
    },
    {
      "type_document": "ice",
      "label": "ICE — Identifiant Commun de l'Entreprise",
      "obligatoire": true,
      "condition": null
    }
  ],
  "documents_specifiques": [],
  "questions_specifiques": [
    {
      "id": "montant_projet",
      "label": "Montant du crédit demandé",
      "type": "number",
      "unite": "MAD",
      "placeholder": "Ex : 500000",
      "obligatoire": true,
      "source_prefill": "diagnostic.reponses.montant_projet",
      "condition": null,
      "utilise_par": ["note_presentation_damane"]
    },
    {
      "id": "duree_credit",
      "label": "Durée souhaitée du crédit",
      "type": "select",
      "options": [
        { "value": "24", "label": "2 ans" },
        { "value": "36", "label": "3 ans" },
        { "value": "48", "label": "4 ans" },
        { "value": "60", "label": "5 ans" },
        { "value": "84", "label": "7 ans" }
      ],
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["note_presentation_damane"]
    },
    {
      "id": "banque_partenaire",
      "label": "Banque partenaire (si déjà choisie)",
      "type": "select",
      "options": [
        { "value": "attijariwafa", "label": "Attijariwafa Bank" },
        { "value": "bmce",         "label": "Bank of Africa (BMCE)" },
        { "value": "cih",          "label": "CIH Bank" },
        { "value": "bp",           "label": "Banque Populaire" },
        { "value": "bmci",         "label": "BMCI" },
        { "value": "sgmb",         "label": "Société Générale Maroc" },
        { "value": "autre",        "label": "Autre / Non encore choisie" }
      ],
      "obligatoire": false,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["note_presentation_damane"]
    }
  ],
  "documents_a_generer": [
    {
      "id": "note_presentation_damane",
      "type_document": "note_presentation",
      "label": "Note de présentation du projet",
      "description": "Document synthétique présentant votre projet, son marché et sa rentabilité pour convaincre la banque.",
      "format": "docx",
      "ordre": 1,
      "mode": "choix",
      "champs_requis": [
        { "id": "nom_entreprise",    "source": "nom_entreprise" },
        { "id": "statut_juridique",  "source": "statut_juridique" },
        { "id": "secteur",           "source": "secteur" },
        { "id": "annee_creation",    "source": "annee_creation" },
        { "id": "effectif",          "source": "effectif" },
        { "id": "montant_projet",    "source": "montant_projet" },
        { "id": "duree_credit",      "source": "duree_credit" },
        { "id": "banque_partenaire", "source": "banque_partenaire" }
      ],
      "questions_contexte": [
        {
          "id": "description_projet_financement",
          "label": "Décrivez le projet que vous souhaitez financer (objet, objectif, étapes)",
          "type": "textarea",
          "placeholder": "Ex : acquisition d'une machine CNC pour tripler notre capacité de production, ouverture d'un atelier de conditionnement...",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["note_presentation_damane"]
        },
        {
          "id": "marche_clients",
          "label": "Quels sont vos clients / marché cible ? Avez-vous des commandes ou contrats en cours ?",
          "type": "textarea",
          "placeholder": "Ex : PME industrielles de la région, nous avons 3 contrats signés pour un total de 1,2 M MAD...",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["note_presentation_damane"]
        },
        {
          "id": "rentabilite_prevue",
          "label": "Rentabilité prévisionnelle (CA attendu, délai de remboursement estimé)",
          "type": "textarea",
          "placeholder": "Ex : CA additionnel attendu de 800K MAD/an, remboursement en 4 ans...",
          "obligatoire": false,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["note_presentation_damane"]
        }
      ],
      "validations": []
    }
  ]
}$json5$::jsonb
WHERE nom ILIKE '%damane express%';


-- ─── 6. MOWAKABA ─────────────────────────────────────────────
UPDATE dispositifs
SET documents_requis_generation = $json6${
  "version": "1.0",
  "coffre_fort_requis": [
    {
      "type_document": "rc",
      "label": "Registre de Commerce",
      "obligatoire": true,
      "condition": null
    }
  ],
  "documents_specifiques": [],
  "questions_specifiques": [
    {
      "id": "nature_projet",
      "label": "Nature du projet d'accompagnement",
      "type": "select",
      "options": [
        { "value": "plan_affaires",  "label": "Elaboration d'un plan d'affaires" },
        { "value": "mise_a_niveau",  "label": "Mise a niveau / restructuration" },
        { "value": "innovation",     "label": "Innovation / R&D" },
        { "value": "digitalisation", "label": "Digitalisation / transformation numerique" },
        { "value": "certification",  "label": "Certification qualite" },
        { "value": "export",         "label": "Developpement a l'export" }
      ],
      "obligatoire": true,
      "condition": null,
      "source_prefill": null,
      "utilise_par": ["descriptif_accompagnement_mowakaba"]
    }
  ],
  "documents_a_generer": [
    {
      "id": "devis_prestataire_mowakaba",
      "type_document": "devis_prestataire",
      "label": "Devis du prestataire d'accompagnement",
      "description": "Devis signé par le prestataire d'accompagnement choisi, avec détail des prestations et coûts.",
      "format": "docx",
      "ordre": 1,
      "mode": "upload",
      "champs_requis": [],
      "questions_contexte": [],
      "validations": []
    },
    {
      "id": "descriptif_accompagnement_mowakaba",
      "type_document": "descriptif_projet",
      "label": "Descriptif du projet d'accompagnement",
      "description": "Fiche projet détaillant les objectifs, le périmètre et les résultats attendus de l'accompagnement.",
      "format": "docx",
      "ordre": 2,
      "mode": "choix",
      "champs_requis": [
        { "id": "nom_entreprise",  "source": "nom_entreprise" },
        { "id": "statut_juridique","source": "statut_juridique" },
        { "id": "secteur",         "source": "secteur" },
        { "id": "effectif",        "source": "effectif" },
        { "id": "annee_creation",  "source": "annee_creation" },
        { "id": "nature_projet",   "source": "nature_projet" }
      ],
      "questions_contexte": [
        {
          "id": "problematique",
          "label": "Quelle problématique cherchez-vous à résoudre avec cet accompagnement ?",
          "type": "textarea",
          "placeholder": "Ex : nos process internes sont peu digitalisés, nous perdons en compétitivité sur les prix faute de lean management...",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["descriptif_accompagnement_mowakaba"]
        },
        {
          "id": "resultats_attendus",
          "label": "Quels résultats concrets attendez-vous à l'issue de l'accompagnement ?",
          "type": "textarea",
          "placeholder": "Ex : réduction de 30% des délais de livraison, mise en place d'un ERP, obtention de la certification ISO 9001...",
          "obligatoire": true,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["descriptif_accompagnement_mowakaba"]
        },
        {
          "id": "budget_accompagnement",
          "label": "Budget total de l'accompagnement prévu (MAD)",
          "type": "number",
          "placeholder": "Ex : 80000",
          "obligatoire": false,
          "condition": null,
          "source_prefill": null,
          "utilise_par": ["descriptif_accompagnement_mowakaba"]
        }
      ],
      "validations": []
    }
  ]
}$json6$::jsonb
WHERE nom ILIKE '%mowakaba%';


-- ─── Vérification ────────────────────────────────────────────
SELECT
  nom,
  organisme,
  CASE WHEN documents_requis_generation IS NOT NULL THEN 'OK' ELSE 'MANQUANT' END AS schema_status,
  documents_requis_generation->>'lien_formulaire_officiel' AS formulaire_officiel
FROM dispositifs
WHERE nom ILIKE ANY(ARRAY['%awrash%','%idmaj%','%taehil%','%tahfiz%','%damane express%','%mowakaba%'])
ORDER BY nom;
