-- ============================================================
-- MIGRATION : Métadonnées dispositifs
-- Ajoute : categorie, public_cible, guichet_ouvert, recurrent, operateur
-- Normalise : type_aide (slug court) sur les 5 dispositifs MA
-- Idempotent via ADD COLUMN IF NOT EXISTS + UPDATE ciblé par slug
-- ============================================================

-- 1. Ajouter les colonnes manquantes
ALTER TABLE dispositifs
  ADD COLUMN IF NOT EXISTS categorie      text,
  ADD COLUMN IF NOT EXISTS public_cible   text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS guichet_ouvert boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS recurrent      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS operateur      text;

-- 2. Reclasser les 5 dispositifs marocains existants

-- charte-tpme → investissement_croissance / prime / CRI
UPDATE dispositifs SET
  type_aide      = 'prime',
  categorie      = 'investissement_croissance',
  public_cible   = ARRAY['tpe', 'pme'],
  guichet_ouvert = true,
  recurrent      = true,
  operateur      = 'CRI'
WHERE slug = 'charte-tpme';

-- mowakaba → digitalisation / subvention / Maroc PME
UPDATE dispositifs SET
  type_aide      = 'subvention',
  categorie      = 'digitalisation',
  public_cible   = ARRAY['tpe', 'pme'],
  guichet_ouvert = true,
  recurrent      = true,
  operateur      = 'Maroc PME'
WHERE slug = 'mowakaba';

-- istitmar → investissement_croissance / prime / Maroc PME
UPDATE dispositifs SET
  type_aide      = 'prime',
  categorie      = 'investissement_croissance',
  public_cible   = ARRAY['tpe', 'pme'],
  guichet_ouvert = true,
  recurrent      = true,
  operateur      = 'Maroc PME'
WHERE slug = 'istitmar';

-- innov-invest → innovation / participation_capital / Tamwilcom (guichet sur appel à projets)
UPDATE dispositifs SET
  type_aide      = 'participation_capital',
  categorie      = 'innovation',
  public_cible   = ARRAY['startup', 'tpe'],
  guichet_ouvert = false,
  recurrent      = false,
  operateur      = 'Tamwilcom'
WHERE slug = 'innov-invest';

-- digital-pme → digitalisation / subvention / ADD
UPDATE dispositifs SET
  type_aide      = 'subvention',
  categorie      = 'digitalisation',
  public_cible   = ARRAY['tpe', 'pme'],
  guichet_ouvert = true,
  recurrent      = true,
  operateur      = 'ADD'
WHERE slug = 'digital-pme';

-- Vérification : afficher l'état après migration
SELECT slug, categorie, type_aide, operateur, guichet_ouvert, recurrent, public_cible
FROM dispositifs
WHERE pays = 'MA'
ORDER BY slug;
