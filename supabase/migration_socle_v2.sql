-- ============================================================
-- MIGRATION SOCLE v2 — Nouvelles colonnes dispositifs + refonte FR
-- À exécuter APRÈS migration_france.sql
-- ============================================================

-- 1. Nouvelles colonnes sur dispositifs
alter table dispositifs
  add column if not exists categorie text
    check (categorie in (
      'creation_reprise', 'innovation_rd', 'fiscal_social', 'digitalisation',
      'embauche_formation', 'transition_ecologique', 'export', 'financement_innovation'
    )),
  add column if not exists public_cible text[] not null default '{}',
  add column if not exists recurrent_annuel boolean not null default false,
  add column if not exists guichet_ouvert boolean not null default true,
  add column if not exists soumis_de_minimis boolean not null default false;

-- 2. Propager recurrent → recurrent_annuel pour les lignes existantes
update dispositifs set recurrent_annuel = recurrent;

-- 3. Mettre à jour type_aide des 5 dispositifs FR vers les valeurs normalisées
-- (les dispositifs MA gardent leurs valeurs textuelles libres)
update dispositifs set type_aide = 'credit_impot'        where slug = 'cir';
update dispositifs set type_aide = 'credit_impot'        where slug = 'cii';
update dispositifs set type_aide = 'subvention'          where slug = 'bourse-french-tech';
update dispositifs set type_aide = 'avance_remboursable' where slug = 'adi-bpi';
update dispositifs set type_aide = 'subvention'          where slug = 'i-nov';

-- 4. Renseigner les nouveaux champs pour les 5 dispositifs FR

-- CIR
update dispositifs set
  categorie        = 'innovation_rd',
  public_cible     = array['tpe', 'pme', 'eti'],
  recurrent_annuel = true,
  guichet_ouvert   = true,
  soumis_de_minimis = false
where slug = 'cir';

-- CII
update dispositifs set
  categorie        = 'innovation_rd',
  public_cible     = array['tpe', 'pme'],
  recurrent_annuel = true,
  guichet_ouvert   = true,
  soumis_de_minimis = false
where slug = 'cii';

-- Bourse French Tech
update dispositifs set
  categorie        = 'creation_reprise',
  public_cible     = array['createur', 'tpe'],
  recurrent_annuel = false,
  guichet_ouvert   = true,
  soumis_de_minimis = true
where slug = 'bourse-french-tech';

-- ADI Bpifrance
update dispositifs set
  categorie        = 'financement_innovation',
  public_cible     = array['pme', 'eti'],
  recurrent_annuel = false,
  guichet_ouvert   = true,
  soumis_de_minimis = false
where slug = 'adi-bpi';

-- i-Nov
update dispositifs set
  categorie        = 'financement_innovation',
  public_cible     = array['pme'],
  recurrent_annuel = false,
  guichet_ouvert   = false,
  soumis_de_minimis = false
where slug = 'i-nov';

-- 5. Index
create index if not exists idx_dispositifs_categorie on dispositifs(categorie);
