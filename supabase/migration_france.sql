-- ============================================================
-- MIGRATION — Extension France (multi-pays)
-- À exécuter APRÈS schema.sql dans Supabase SQL Editor
-- ============================================================

-- 1. Nouvelles colonnes sur dispositifs
alter table dispositifs
  add column if not exists pays      text not null default 'MA' check (pays in ('MA', 'FR')),
  add column if not exists devise    text not null default 'MAD' check (devise in ('MAD', 'EUR')),
  add column if not exists prochaine_echeance date,
  add column if not exists millesime integer,
  add column if not exists recurrent boolean not null default false;

-- 2. Nouvelle colonne sur diagnostics
alter table diagnostics
  add column if not exists pays text not null default 'MA' check (pays in ('MA', 'FR'));

-- 3. Mettre à jour les dispositifs marocains existants
update dispositifs set pays = 'MA', devise = 'MAD' where pays = 'MA';

-- 4. Index supplémentaires
create index if not exists idx_dispositifs_pays on dispositifs(pays);
create index if not exists idx_diagnostics_pays  on diagnostics(pays);

-- ============================================================
-- SEED France — 5 dispositifs
-- ============================================================
-- IMPORTANT : Ces critères sont INDICATIFS et ont été établis à partir de
-- sources secondaires (bpifrance.fr, impots.gouv.fr, entreprendre.service-public.fr,
-- france2030.gouv.fr). Ils DOIVENT être vérifiés depuis les sources officielles
-- avant toute mise en production.
-- Les taux et plafonds du CIR/CII évoluent avec les lois de finances annuelles :
-- mettre à jour `millesime` et `derniere_verification` à chaque exercice.
-- ============================================================

insert into dispositifs (
  slug, nom, organisme, type_aide,
  montant_max, taux,
  pays, devise, millesime, recurrent,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values

-- 1. CIR
(
  'cir',
  'Crédit d''Impôt Recherche (CIR)',
  'DGFiP / MESR',
  'Crédit d''impôt sur dépenses R&D (30% jusqu''à 100 M€ de dépenses, 5% au-delà)',
  null, 30,
  'FR', 'EUR', 2025, true,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "regime_fiscal",
        "label": "Entreprise soumise à l''IS ou à l''IR régime réel",
        "type": "enum_includes",
        "champ": "regime_fiscal",
        "valeurs": ["IS", "IR_reel"],
        "bloquant": true,
        "message_echec": "Le CIR est un crédit d''impôt : il n''est accessible qu''aux entreprises en régime IS ou IR réel. Les micro-entreprises en sont exclues."
      },
      {
        "id": "nature_rd",
        "label": "Projet de R&D avec verrous scientifiques/techniques (Manuel de Frascati)",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["rd_verrous"],
        "bloquant": true,
        "message_echec": "Le CIR couvre exclusivement les activités de R&D : incertitude technique réelle, démarche expérimentale, verrous identifiés. Un projet de simple innovation produit relève du CII."
      },
      {
        "id": "personnel_rd",
        "label": "Personnel R&D dédié et identifiable (chercheurs, techniciens de recherche)",
        "type": "enum_excludes",
        "champ": "personnel_rd",
        "valeurs": ["0"],
        "bloquant": false,
        "message_echec": "Le dossier justificatif CIR exige des feuilles de temps de chercheurs ou techniciens identifiables."
      },
      {
        "id": "situation_fiscale",
        "label": "Obligations fiscales et sociales à jour",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "La régularité fiscale et sociale est requise."
      }
    ]
  }',
  '["Dossier justificatif technique par projet R&D (état de l''art, verrous, travaux réalisés)", "Feuilles de temps du personnel R&D", "Cerfa 2069-A (déclaration CIR)", "Annexes financières détaillées (masse salariale R&D, amortissements, sous-traitance agréée)"]',
  'Récurrent — déclaré annuellement avec la liasse fiscale',
  'https://www.impots.gouv.fr/professionnel/le-credit-dimpot-recherche',
  '2026-06-01',
  true
),

-- 2. CII
(
  'cii',
  'Crédit d''Impôt Innovation (CII)',
  'DGFiP',
  'Crédit d''impôt de 20% des dépenses d''innovation (PME uniquement, plafonné à 400 K€/an de dépenses, prorogé jusqu''à fin 2027)',
  80000, 20,
  'FR', 'EUR', 2025, true,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "regime_fiscal",
        "label": "Régime fiscal IS ou IR réel",
        "type": "enum_includes",
        "champ": "regime_fiscal",
        "valeurs": ["IS", "IR_reel"],
        "bloquant": true,
        "message_echec": "Le CII est un crédit d''impôt réservé aux régimes IS ou IR réel."
      },
      {
        "id": "effectif_pme",
        "label": "Effectif < 250 salariés (critère PME UE — obligatoire)",
        "type": "enum_includes",
        "champ": "effectif",
        "valeurs": ["<10", "10-49", "50-249"],
        "bloquant": true,
        "message_echec": "Le CII est réservé aux PME : effectif < 250 salariés (cumulatif avec le seuil de CA ou de bilan)."
      },
      {
        "id": "ca_pme",
        "label": "CA annuel ≤ 50 M€ OU total bilan ≤ 43 M€ (critère PME UE — l''un ou l''autre suffit)",
        "type": "range",
        "champ": "ca_annuel",
        "min": null,
        "max": "50000000",
        "bloquant": false,
        "message_echec": "CA > 50 M€ : vous restez éligible si votre total de bilan est < 43 M€ — à vérifier avec votre expert-comptable."
      },
      {
        "id": "nature_innovation_produit",
        "label": "Projet de conception de prototype ou installation pilote d''un produit nouveau",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["innovation_produit"],
        "bloquant": true,
        "message_echec": "Le CII couvre la conception de prototypes de produits aux performances supérieures au marché. Pour la R&D fondamentale/appliquée, c''est le CIR."
      },
      {
        "id": "non_cumul_cir",
        "label": "Dépenses distinctes des dépenses CIR (non cumulables sur les mêmes postes)",
        "type": "boolean",
        "champ": "deja_cir_cii",
        "valeur": false,
        "bloquant": false,
        "message_echec": "CIR et CII ne peuvent pas couvrir les mêmes dépenses. Si vous déposez un CIR, les dépenses CII doivent être clairement séparées dans votre comptabilité."
      }
    ]
  }',
  '["Dossier justificatif produit nouveau (comparaison des performances vs marché)", "Cerfa 2069-A (même déclaration que CIR)", "Détail des dépenses d''innovation (prototypage, études, dépôts)", "Attestation expert-comptable si besoin"]',
  'Récurrent — déclaré annuellement avec la liasse fiscale',
  'https://www.impots.gouv.fr/professionnel/le-credit-dimpot-en-faveur-de-linnovation',
  '2026-06-01',
  true
),

-- 3. Bourse French Tech
(
  'bourse-french-tech',
  'Bourse French Tech',
  'Bpifrance',
  'Subvention jusqu''à 50 000€, couvrant jusqu''à 70% des dépenses éligibles',
  50000, 70,
  'FR', 'EUR', null, false,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "depenses_non_engagees",
        "label": "Aucune dépense engagée sur le projet avant la demande",
        "type": "boolean",
        "champ": "depenses_engagees",
        "valeur": false,
        "bloquant": true,
        "message_echec": "BLOQUANT — Des dépenses déjà engagées rendent la demande irrecevable. La Bourse French Tech ne peut financer que des dépenses futures à la date de dépôt."
      },
      {
        "id": "projet_innovant",
        "label": "Projet innovant (technologie, usage ou modèle économique)",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["rd_verrous", "innovation_produit", "creation_amorcage"],
        "bloquant": false,
        "message_echec": "La Bourse French Tech cible des projets à forte dimension innovante."
      },
      {
        "id": "entreprise_recente",
        "label": "Entreprise de moins de 5 ans ou projet de création",
        "type": "range",
        "champ": "annee_creation",
        "min": "2020",
        "max": null,
        "bloquant": false,
        "message_echec": "La Bourse French Tech cible prioritairement les créateurs et entreprises de moins de 5 ans."
      },
      {
        "id": "budget_coherent",
        "label": "Budget projet ≤ 200 K€ (compatible avec le plafond de la Bourse)",
        "type": "enum_includes",
        "champ": "budget_projet",
        "valeurs": ["<50K", "50K-200K"],
        "bloquant": false,
        "message_echec": "La Bourse couvre jusqu''à 50 000€ (70% de ~71K€). Pour des projets plus importants, envisagez l''ADI Bpifrance."
      },
      {
        "id": "situation_fiscale",
        "label": "Situation fiscale et sociale à jour",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "La régularité est requise pour tout dossier Bpifrance."
      }
    ]
  }',
  '["Présentation du projet innovant (problème, solution, marché)", "Budget prévisionnel détaillé", "Plan de financement", "CV de l''équipe fondatrice", "Statuts ou projet de statuts"]',
  '2 à 4 mois',
  'https://www.bpifrance.fr/nos-solutions/bourse-french-tech',
  '2026-06-01',
  true
),

-- 4. ADI BPI
(
  'adi-bpi',
  'Aide au Développement de l''Innovation — Bpifrance',
  'Bpifrance',
  'Subvention et/ou avance récupérable : de 50 K€ (maturation) jusqu''à 2 M€ selon le projet',
  2000000, 50,
  'FR', 'EUR', null, false,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "depenses_non_engagees",
        "label": "Aucune dépense engagée sur le projet avant la demande",
        "type": "boolean",
        "champ": "depenses_engagees",
        "valeur": false,
        "bloquant": true,
        "message_echec": "BLOQUANT — Règle commune Bpifrance : seules les dépenses postérieures au dépôt du dossier sont éligibles."
      },
      {
        "id": "nature_rd_innov",
        "label": "Projet de R&D ou d''innovation structuré (développement produit/service/procédé)",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["rd_verrous", "innovation_produit"],
        "bloquant": false,
        "message_echec": "L''ADI Bpifrance finance le développement de produits, services ou procédés innovants."
      },
      {
        "id": "budget_min",
        "label": "Budget projet ≥ 50 K€",
        "type": "enum_excludes",
        "champ": "budget_projet",
        "valeurs": ["<50K"],
        "bloquant": false,
        "message_echec": "Pour des projets < 50 K€, la Bourse French Tech est plus adaptée."
      },
      {
        "id": "cofinancement",
        "label": "Capacité à financer la part non couverte par l''aide",
        "type": "boolean",
        "champ": "cofinancement_ok",
        "valeur": true,
        "bloquant": false,
        "message_echec": "Bpifrance exige que l''entreprise puisse financer la part non subventionnée (fonds propres + emprunts complémentaires)."
      },
      {
        "id": "situation_fiscale",
        "label": "Situation fiscale et sociale à jour",
        "type": "enum_includes",
        "champ": "situation_administrative",
        "valeurs": ["oui"],
        "bloquant": false,
        "message_echec": "La régularité est requise pour tout dossier Bpifrance."
      }
    ]
  }',
  '["Dossier technique R&D/innovation (description du projet, état de l''art, plan de travail)", "Business plan et prévisionnel financier 3 ans", "Plan de financement du projet", "Annexes financières (bilans, comptes de résultat 3 derniers exercices)", "CV équipe de direction"]',
  '3 à 6 mois (instruction Bpifrance)',
  'https://www.bpifrance.fr/nos-solutions/innovation',
  '2026-06-01',
  true
),

-- 5. i-Nov
(
  'i-nov',
  'Concours d''innovation i-Nov (France 2030)',
  'Bpifrance / ADEME — France 2030',
  'Cofinancement 45% des dépenses pour PME, projets entre 600 K€ et 5 M€',
  null, 45,
  'FR', 'EUR', null, false,
  '{
    "version": 1,
    "criteres": [
      {
        "id": "effectif_pme",
        "label": "PME au sens communautaire (< 250 salariés)",
        "type": "enum_includes",
        "champ": "effectif",
        "valeurs": ["<10", "10-49", "50-249"],
        "bloquant": true,
        "message_echec": "i-Nov est réservé aux PME : effectif < 250 salariés ET (CA < 50 M€ ou bilan < 43 M€)."
      },
      {
        "id": "depenses_non_engagees",
        "label": "Aucune dépense engagée sur le projet avant le dépôt",
        "type": "boolean",
        "champ": "depenses_engagees",
        "valeur": false,
        "bloquant": true,
        "message_echec": "BLOQUANT — Règle Bpifrance : les dépenses engagées avant le dépôt du dossier sont inéligibles."
      },
      {
        "id": "budget_inov",
        "label": "Budget projet entre 600 K€ et 5 M€",
        "type": "enum_includes",
        "champ": "budget_projet",
        "valeurs": ["600K-2M", "2M-5M"],
        "bloquant": true,
        "message_echec": "i-Nov finance des projets entre 600 K€ et 5 M€. En deçà, orientez-vous vers la Bourse French Tech ou l''ADI Bpifrance."
      },
      {
        "id": "cofinancement_55",
        "label": "Capacité à cofinancer 55% du projet",
        "type": "boolean",
        "champ": "cofinancement_ok",
        "valeur": true,
        "bloquant": false,
        "message_echec": "i-Nov couvre 45% des dépenses. Les 55% restants sont à votre charge (fonds propres + emprunts)."
      },
      {
        "id": "nature_innovante",
        "label": "Projet dans une thématique France 2030 (numérique, santé, énergie, transition écologique…)",
        "type": "enum_includes",
        "champ": "nature_projet",
        "valeurs": ["rd_verrous", "innovation_produit"],
        "bloquant": false,
        "message_echec": "i-Nov sélectionne des projets dans les thématiques des vagues France 2030. Vérifiez l''adéquation sur france2030.gouv.fr."
      },
      {
        "id": "vague_calendrier",
        "label": "Candidature déposée pendant une vague ouverte (consultez la date de clôture)",
        "type": "boolean",
        "champ": "cofinancement_ok",
        "valeur": true,
        "bloquant": false,
        "message_echec": "i-Nov fonctionne par vagues (2-3 par an). Consultez la date de clôture de la prochaine vague sur france2030.gouv.fr avant de déposer."
      }
    ]
  }',
  '["Dossier de candidature complet Bpifrance (excellence scientifique, impact, plan de mise en œuvre)", "Annexes financières (bilans, prévisionnel)", "Engagement de cofinancement (attestation CAC ou expert-comptable)", "CV équipe et organigramme"]',
  '4 à 6 mois (instruction par vague)',
  'https://www.bpifrance.fr/nos-solutions/i-nov',
  '2026-06-01',
  true
)

on conflict (slug) do update set
  nom                   = excluded.nom,
  organisme             = excluded.organisme,
  type_aide             = excluded.type_aide,
  montant_max           = excluded.montant_max,
  taux                  = excluded.taux,
  pays                  = excluded.pays,
  devise                = excluded.devise,
  millesime             = excluded.millesime,
  recurrent             = excluded.recurrent,
  regles                = excluded.regles,
  documents_requis      = excluded.documents_requis,
  delai_indicatif       = excluded.delai_indicatif,
  lien_officiel         = excluded.lien_officiel,
  derniere_verification = excluded.derniere_verification,
  actif                 = excluded.actif;

-- Mettre à jour la date de prochaine échéance i-Nov (à maintenir à jour manuellement)
update dispositifs set prochaine_echeance = '2025-11-30' where slug = 'i-nov';
