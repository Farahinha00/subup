-- ============================================================
-- PATCH : Renseigner operateur + categorie pour les 5 dispositifs MA d'origine
-- Idempotent (WHERE operateur IS NULL protège les ré-exécutions)
-- ============================================================

UPDATE dispositifs SET
  operateur = 'CRI',
  categorie = 'investissement_croissance',
  public_cible = ARRAY['auto_entrepreneur', 'tpe', 'pme']
WHERE slug = 'charte-tpme' AND (operateur IS NULL OR operateur = '');

UPDATE dispositifs SET
  operateur = 'Maroc PME',
  categorie = 'digitalisation',
  public_cible = ARRAY['tpe', 'pme']
WHERE slug = 'mowakaba' AND (operateur IS NULL OR operateur = '');

UPDATE dispositifs SET
  operateur = 'Maroc PME',
  categorie = 'investissement_croissance',
  public_cible = ARRAY['tpe', 'pme']
WHERE slug = 'istitmar' AND (operateur IS NULL OR operateur = '');

UPDATE dispositifs SET
  operateur = 'Tamwilcom',
  categorie = 'financement_garantie',
  public_cible = ARRAY['tpe', 'pme', 'startup']
WHERE slug = 'innov-invest' AND (operateur IS NULL OR operateur = '');

UPDATE dispositifs SET
  operateur = 'ADD',
  categorie = 'digitalisation',
  public_cible = ARRAY['tpe', 'pme']
WHERE slug = 'digital-pme' AND (operateur IS NULL OR operateur = '');

-- Activation pour personas de test (à garder actif si programmes vérifiés)
-- UPDATE dispositifs SET actif = true WHERE slug IN ('tahfiz', 'idmaj', 'taehil');

-- Vérification
SELECT slug, operateur, categorie, actif, guichet_ouvert
FROM dispositifs
WHERE pays = 'MA'
ORDER BY operateur, slug;
