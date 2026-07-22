-- =============================================================
-- Corrections Itération 1 — suite à validation terrain
-- Coller dans Supabase SQL Editor et exécuter en une fois
-- =============================================================


-- ─── 1. CORRECTIONS OPÉRATEURS (critique) ─────────────────────
UPDATE dispositifs SET organisme = 'ANAPEC'    WHERE nom ILIKE '%taehil%';
UPDATE dispositifs SET organisme = 'Maroc PME' WHERE nom ILIKE '%mowakaba%';


-- ─── 2. AWRASH 2 ──────────────────────────────────────────────
-- + question type_contrat (CDI uniquement)
-- + lien portail ANAPEC
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{lien_formulaire_officiel}',
  '"https://www.anapec.org"'
)
WHERE nom ILIKE '%awrash%';

UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{questions_specifiques}',
  documents_requis_generation->'questions_specifiques' || $qa$
[{
  "id": "type_contrat",
  "label": "Type de contrat — Awrash 2 couvre les CDI uniquement (emploi durable)",
  "type": "select",
  "options": [{ "value": "CDI", "label": "CDI — Contrat à Durée Indéterminée" }],
  "obligatoire": true,
  "condition": null,
  "source_prefill": null,
  "utilise_par": ["lettre_presentation_awrash"]
}]
$qa$::jsonb
)
WHERE nom ILIKE '%awrash%';

-- Ajouter type_contrat dans le contexte IA de la lettre de présentation
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{documents_a_generer,0,champs_requis}',
  documents_requis_generation->'documents_a_generer'->0->'champs_requis'
  || '[{"id": "type_contrat", "source": "type_contrat"}]'::jsonb
)
WHERE nom ILIKE '%awrash%';


-- ─── 3. IDMAJ ─────────────────────────────────────────────────
-- + attestation_cnsss au coffre-fort (cohérent avec les autres programmes ANAPEC)
-- + lien portail ANAPEC
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{lien_formulaire_officiel}',
  '"https://www.anapec.org"'
)
WHERE nom ILIKE '%idmaj%';

UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{coffre_fort_requis}',
  documents_requis_generation->'coffre_fort_requis' || $cf_idmaj$
[{
  "type_document": "attestation_cnsss",
  "label": "Attestation CNSS",
  "description": "Attestation d immatriculation — immatriculation CNSS du futur salarie est une etape obligatoire du contrat IDMAJ",
  "obligatoire": true,
  "condition": null
}]
$cf_idmaj$::jsonb
)
WHERE nom ILIKE '%idmaj%';


-- ─── 4. TAEHIL ────────────────────────────────────────────────
-- Operateur corrige (ANAPEC) — fait etape 1
-- + attestation_cnsss au coffre-fort
-- + question sous_programme en premier (ajoutee avant les 3 questions existantes)
-- + lien portail ANAPEC
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{lien_formulaire_officiel}',
  '"https://www.anapec.org"'
)
WHERE nom ILIKE '%taehil%';

UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{coffre_fort_requis}',
  documents_requis_generation->'coffre_fort_requis' || $cf_taehil$
[{
  "type_document": "attestation_cnsss",
  "label": "Attestation CNSS",
  "description": "Attestation d immatriculation et de regularite des cotisations",
  "obligatoire": true,
  "condition": null
}]
$cf_taehil$::jsonb
)
WHERE nom ILIKE '%taehil%';

-- Remplacement complet des questions : sous_programme en premier + les 3 existantes
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{questions_specifiques}',
  $qt$
[{
  "id": "sous_programme_taehil",
  "label": "Sous-programme Taehil",
  "type": "select",
  "options": [
    { "value": "fce", "label": "FCE — Formation Contractualisee pour les Entreprises" },
    { "value": "fse", "label": "FSE — Formation Secteurs Emergents" },
    { "value": "fpe", "label": "FPE — Formation Prealable a l Embauche" }
  ],
  "obligatoire": true,
  "condition": null,
  "source_prefill": null,
  "utilise_par": ["descriptif_formation_taehil"]
},
{
  "id": "type_formation",
  "label": "Type de formation",
  "type": "select",
  "options": [
    { "value": "technique",    "label": "Formation technique / metier" },
    { "value": "management",   "label": "Management / leadership" },
    { "value": "langues",      "label": "Langues etrangeres" },
    { "value": "informatique", "label": "Informatique / numerique" },
    { "value": "securite",     "label": "Securite / HSE" }
  ],
  "obligatoire": true,
  "condition": null,
  "source_prefill": null,
  "utilise_par": ["descriptif_formation_taehil"]
},
{
  "id": "nb_beneficiaires",
  "label": "Nombre de beneficiaires",
  "type": "number",
  "unite": "salaries",
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
  "placeholder": "Nom de l organisme",
  "obligatoire": true,
  "condition": null,
  "source_prefill": null,
  "utilise_par": ["descriptif_formation_taehil"]
}]
$qt$::jsonb
)
WHERE nom ILIKE '%taehil%';

-- Mettre a jour la description du document pour refleter le changement d operateur
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{documents_a_generer,0,description}',
  '"Convention de formation etablie dans le cadre du programme Taehil ANAPEC (FCE / FSE / FPE selon le sous-programme). Document fourni par l organisme de formation partenaire — a uploaderpar le client."'
)
WHERE nom ILIKE '%taehil%';


-- ─── 5. TAHFIZ ────────────────────────────────────────────────
-- + question type_contrat (CDI + note sur la regle des 2 ans)
-- + lien portail ANAPEC
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{lien_formulaire_officiel}',
  '"https://www.anapec.org"'
)
WHERE nom ILIKE '%tahfiz%';

UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{questions_specifiques}',
  documents_requis_generation->'questions_specifiques' || $qth$
[{
  "id": "type_contrat",
  "label": "Type de contrat — Tahfiz couvre les CDI uniquement (recrutement dans les 2 ans suivant la creation de l entreprise)",
  "type": "select",
  "options": [{ "value": "CDI", "label": "CDI — Contrat a Duree Indeterminee" }],
  "obligatoire": true,
  "condition": null,
  "source_prefill": null,
  "utilise_par": ["lettre_engagement_tahfiz"]
}]
$qth$::jsonb
)
WHERE nom ILIKE '%tahfiz%';

-- Ajouter type_contrat dans le contexte IA de la lettre d engagement
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{documents_a_generer,0,champs_requis}',
  documents_requis_generation->'documents_a_generer'->0->'champs_requis'
  || '[{"id": "type_contrat", "source": "type_contrat"}]'::jsonb
)
WHERE nom ILIKE '%tahfiz%';

-- Mettre a jour la description de la lettre pour rappeler la duree 24 mois et la regle 2 ans
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{documents_a_generer,0,description}',
  '"Lettre formelle d engagement a maintenir les postes crees en CDI et a respecter les conditions Tahfiz. Exoneration de 24 mois. Eligibilite limitee aux entreprises creees entre le 01/01/2015 et le 31/12/2026 et recrutant dans leurs 2 premieres annees d existence."'
)
WHERE nom ILIKE '%tahfiz%';


-- ─── 6. DAMANE EXPRESS ────────────────────────────────────────
-- + rc au coffre-fort (exige par toutes les banques partenaires)
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{coffre_fort_requis}',
  documents_requis_generation->'coffre_fort_requis' || $cf_damane$
[{
  "type_document": "rc",
  "label": "Registre de Commerce",
  "description": "Copie certifiee conforme — exige systematiquement par les banques partenaires Tamwilcom",
  "obligatoire": true,
  "condition": null
}]
$cf_damane$::jsonb
)
WHERE nom ILIKE '%damane express%';

-- Mettre a jour la description de la note de presentation pour clarifier le circuit
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{documents_a_generer,0,description}',
  '"Document synthetique presentant votre projet pour convaincre la banque partenaire. Note : le dossier Damane Express se depose aupres de votre banque (pas directement chez Tamwilcom) — la banque instruit la garantie en votre nom."'
)
WHERE nom ILIKE '%damane express%';


-- ─── 7. MOWAKABA ──────────────────────────────────────────────
-- Operateur corrige (Maroc PME) — fait etape 1
-- + attestation_fiscale au coffre-fort (obligatoire)
-- + dernier_bilan au coffre-fort (optionnel)
-- + lien plateforme Jisr / Maroc PME
-- + note prestataire agree dans description du devis
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{lien_formulaire_officiel}',
  '"https://candidatures.marocpme.gov.ma"'
)
WHERE nom ILIKE '%mowakaba%';

UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{coffre_fort_requis}',
  documents_requis_generation->'coffre_fort_requis' || $cf_mowakaba$
[
  {
    "type_document": "attestation_fiscale",
    "label": "Attestation de regularite fiscale",
    "description": "Delivree par la Direction Generale des Impots (DGI) — regularite fiscale obligatoire pour tout dossier Maroc PME",
    "obligatoire": true,
    "condition": null
  },
  {
    "type_document": "dernier_bilan",
    "label": "Dernier bilan comptable",
    "description": "Dernier exercice certifie si disponible. Non requis pour les entreprises de moins d 1 an.",
    "obligatoire": false,
    "condition": null
  }
]
$cf_mowakaba$::jsonb
)
WHERE nom ILIKE '%mowakaba%';

-- Note critique : le prestataire doit etre reference Maroc PME
UPDATE dispositifs
SET documents_requis_generation = jsonb_set(
  documents_requis_generation,
  '{documents_a_generer,0,description}',
  '"Devis signe par un prestataire reference dans le repertoire Maroc PME (marocpme.gov.ma). ATTENTION : le prestataire doit imperativement etre agree Maroc PME — un devis d un prestataire non reference ne sera pas accepte par la commission."'
)
WHERE nom ILIKE '%mowakaba%';


-- ─── Verification finale ───────────────────────────────────────
SELECT
  nom,
  organisme,
  documents_requis_generation->>'lien_formulaire_officiel'               AS lien_formulaire,
  jsonb_array_length(documents_requis_generation->'coffre_fort_requis')  AS nb_coffre_fort,
  jsonb_array_length(documents_requis_generation->'questions_specifiques') AS nb_questions,
  jsonb_array_length(documents_requis_generation->'documents_a_generer')  AS nb_documents
FROM dispositifs
WHERE nom ILIKE ANY(ARRAY['%awrash%','%idmaj%','%taehil%','%tahfiz%','%damane%','%mowakaba%'])
ORDER BY nom;
