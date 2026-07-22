-- ============================================================
-- MIGRATION : Dispositifs emploi_formation Maroc (ANAPEC)
-- TAHFIZ · IDMAJ · TAEHIL · AWRASH 2
-- actif = false par défaut (à activer après vérification anapec.ma)
-- Idempotent via ON CONFLICT (slug) DO UPDATE
-- ============================================================

-- 1. S'assurer que toutes les colonnes métadonnées existent
ALTER TABLE dispositifs
  ADD COLUMN IF NOT EXISTS categorie      text,
  ADD COLUMN IF NOT EXISTS public_cible   text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS guichet_ouvert boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS recurrent      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS operateur      text;

-- 2. Élargir la contrainte CHECK sur categorie pour inclure les catégories MA
--    (migration_socle_v2.sql l'avait restreinte aux seules catégories FR)
ALTER TABLE dispositifs DROP CONSTRAINT IF EXISTS dispositifs_categorie_check;

ALTER TABLE dispositifs ADD CONSTRAINT dispositifs_categorie_check
  CHECK (categorie IS NULL OR categorie IN (
    -- Maroc
    'investissement_croissance', 'digitalisation', 'financement_garantie',
    'emploi_formation', 'sectoriel_tourisme', 'transition_ecologique',
    'innovation', 'diaspora',
    -- France
    'creation_reprise', 'innovation_rd', 'fiscal_social', 'embauche_formation',
    'transition_ecologique', 'export', 'financement_innovation'
  ));

-- ============================================================
-- 2. Seed : 4 dispositifs ANAPEC
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
-- 1. TAHFIZ
-- ----------------------------------------------------------
(
  'tahfiz',
  'TAHFIZ — Exonérations fiscales & sociales pour nouvelles recrues',
  'ANAPEC / Direction Générale des Impôts',
  'exoneration_sociale',
  NULL, NULL,
  'MA', 'MAD', true,
  'emploi_formation',
  ARRAY['tpe', 'pme', 'createur'],
  true,
  'ANAPEC',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "statut_formel",
        "label": "Entreprise, association ou coopérative formellement constituée",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["SARL", "SA"],
        "bloquant": false,
        "message_echec": "TAHFIZ cible les personnes morales (SARL, SA). Les associations et coopératives peuvent également être éligibles — à vérifier sur anapec.ma. Les auto-entrepreneurs sont exclus."
      },
      {
        "id": "entreprise_jeune",
        "label": "Entreprise créée depuis moins de 2 ans (fenêtre TAHFIZ à vérifier sur anapec.ma)",
        "type": "range",
        "champ": "annee_creation",
        "min": "2024",
        "max": null,
        "bloquant": true,
        "message_echec": "TAHFIZ s''applique aux entreprises nouvellement créées. La fenêtre exacte de dates de création est à vérifier sur anapec.ma — les entreprises créées avant 2024 peuvent être exclues de la cohorte en cours."
      },
      {
        "id": "embauche_prevue",
        "label": "Embauche(s) en CDI prévue(s) dans les 24 mois suivant la création",
        "type": "enum_excludes",
        "champ": "embauche_prevue_ma",
        "valeurs": ["non"],
        "bloquant": true,
        "message_echec": "TAHFIZ est conditionné à la création d''emplois en CDI déclarés à la CNSS. Sans embauche prévue, le dispositif ne s''applique pas."
      },
      {
        "id": "affiliation_cnss",
        "label": "Affiliation CNSS et situation administrative régulière",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui", "en_cours"],
        "bloquant": false,
        "message_echec": "L''affiliation CNSS est requise pour la prise en charge des charges patronales (CNSS + TFP). Une démarche de régularisation en cours peut être acceptée."
      }
    ]
  }',
  '["Formulaire de demande TAHFIZ (anapec.ma)", "Contrats de travail CDI des recrues", "Déclarations CNSS des salariés concernés", "RC et statuts de l''entreprise", "Attestation fiscale (DGI)", "RIB de l''entreprise"]',
  '1 à 2 mois après dépôt',
  'https://www.anapec.org',
  '2026-07-06',
  false -- À activer après vérification de la fenêtre de création sur anapec.ma
),

-- ----------------------------------------------------------
-- 2. IDMAJ
-- ----------------------------------------------------------
(
  'idmaj',
  'IDMAJ — Contrats d''insertion pour jeunes diplômés',
  'ANAPEC',
  'exoneration_sociale',
  NULL, NULL,
  'MA', 'MAD', true,
  'emploi_formation',
  ARRAY['tpe', 'pme'],
  true,
  'ANAPEC',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "embauche_prevue",
        "label": "Embauche(s) prévue(s) dans les 12 mois",
        "type": "enum_excludes",
        "champ": "emplois_prevus",
        "valeurs": ["0"],
        "bloquant": true,
        "message_echec": "IDMAJ nécessite une embauche effective. Sans recrutement prévu, le dispositif ne s''applique pas."
      },
      {
        "id": "profil_junior",
        "label": "Recrutement de jeunes diplômés inscrits à l''ANAPEC",
        "type": "enum_includes",
        "champ": "embauche_prevue_ma",
        "valeurs": ["cdi_juniors", "les_deux"],
        "bloquant": true,
        "message_echec": "IDMAJ cible spécifiquement les jeunes diplômés (Bac+2 minimum) inscrits à l''ANAPEC comme demandeurs d''emploi. Pour des profils expérimentés uniquement, IDMAJ ne s''applique pas."
      }
    ]
  }',
  '["Convention IDMAJ signée avec l''ANAPEC", "Contrat de travail du candidat ANAPEC", "CV et diplôme(s) du candidat", "Fiche de poste", "RC et statuts de l''entreprise", "Attestation d''inscription du candidat à l''ANAPEC"]',
  '2 à 4 semaines après convention',
  'https://www.anapec.org',
  '2026-07-06',
  false
),

-- ----------------------------------------------------------
-- 3. TAEHIL
-- ----------------------------------------------------------
(
  'taehil',
  'TAEHIL — Financement de la formation préalable à l''embauche',
  'ANAPEC',
  'subvention',
  100000, 100,
  'MA', 'MAD', true,
  'emploi_formation',
  ARRAY['tpe', 'pme'],
  true,
  'ANAPEC',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "embauche_ou_formation",
        "label": "Embauche ou plan de formation prévu",
        "type": "enum_excludes",
        "champ": "embauche_prevue_ma",
        "valeurs": ["non"],
        "bloquant": false,
        "message_echec": "TAEHIL finance la formation préalable à l''embauche ou la formation contractualisée dans des secteurs émergents. Un recrutement ou plan de formation est nécessaire."
      },
      {
        "id": "poste_identifie",
        "label": "Poste(s) à pourvoir identifié(s)",
        "type": "enum_excludes",
        "champ": "emplois_prevus",
        "valeurs": ["0"],
        "bloquant": false,
        "message_echec": "TAEHIL requiert l''identification d''un poste précis et d''un profil de candidat pour financer la formation adéquate."
      }
    ]
  }',
  '["Formulaire de demande TAEHIL (anapec.ma)", "Fiche de poste et profil recherché", "Programme de formation détaillé", "Devis du prestataire de formation", "Convention de partenariat ANAPEC-entreprise", "RC et statuts de l''entreprise"]',
  '3 à 6 semaines après dépôt complet',
  'https://www.anapec.org',
  '2026-07-06',
  false
),

-- ----------------------------------------------------------
-- 4. AWRASH 2
-- ----------------------------------------------------------
(
  'awrash2',
  'AWRASH 2 — Prime d''embauche CDI (1 500 DH/mois × 9 mois) [programme conjoncturel — vérifier disponibilité sur anapec.ma]',
  'ANAPEC',
  'prime',
  13500, NULL,
  'MA', 'MAD', false,
  'emploi_formation',
  ARRAY['tpe', 'pme'],
  false,
  'ANAPEC',
  '{
    "version": 1,
    "criteres": [
      {
        "id": "embauche_cdi",
        "label": "Embauche(s) en CDI d''au moins 1 an prévue(s)",
        "type": "enum_excludes",
        "champ": "embauche_prevue_ma",
        "valeurs": ["non"],
        "bloquant": true,
        "message_echec": "AWRASH 2 est conditionné à l''embauche en CDI (contrat minimum 1 an). Sans recrutement prévu, la prime ne s''applique pas."
      },
      {
        "id": "nb_emplois",
        "label": "Au moins un emploi CDI créé",
        "type": "enum_excludes",
        "champ": "emplois_prevus",
        "valeurs": ["0"],
        "bloquant": true,
        "message_echec": "La prime AWRASH 2 (1 500 DH/mois × 9 mois) est versée par emploi CDI créé, pour 10 recrues maximum. Aucun emploi prévu = prime nulle."
      }
    ]
  }',
  '["Formulaire de demande AWRASH 2 (anapec.ma — si programme actif)", "Contrat CDI de la recrue", "Déclaration CNSS de la recrue", "RC et statuts de l''entreprise", "RIB de l''entreprise"]',
  '1 à 3 mois (si programme ouvert)',
  'https://www.anapec.org',
  '2026-07-06',
  false -- Programme conjoncturel : vérifier qu''il est toujours actif sur anapec.ma avant d''activer (actif=true)
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
SELECT slug, nom, categorie, type_aide, actif, operateur
FROM dispositifs
WHERE categorie = 'emploi_formation'
ORDER BY slug;
