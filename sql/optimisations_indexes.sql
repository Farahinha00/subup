-- =============================================================
-- Optimisations — Index manquants
-- Coller dans Supabase SQL Editor et exécuter
-- =============================================================

-- Index principal : accélère le chargement du dashboard et de /resultats/[id]
-- (requête .in('diagnostic_id', ids) sur la table resultats)
CREATE INDEX IF NOT EXISTS resultats_diagnostic_id_idx
  ON resultats (diagnostic_id);

-- Index secondaire : accélère le filtre par statut sur les résultats
CREATE INDEX IF NOT EXISTS resultats_statut_idx
  ON resultats (statut);

-- Index sur demandes : accélère la vérification "déjà demandé ?" sur /resultats/[id]
CREATE INDEX IF NOT EXISTS demandes_diagnostic_id_idx
  ON demandes_accompagnement (diagnostic_id);

CREATE INDEX IF NOT EXISTS demandes_user_id_idx
  ON demandes_accompagnement (user_id);

-- Vérification
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('resultats', 'demandes_accompagnement')
ORDER BY tablename, indexname;
