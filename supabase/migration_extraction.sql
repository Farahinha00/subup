-- ============================================================
-- MIGRATION : wizard IA — champs description_projet + extraction
-- Idempotent via ADD COLUMN IF NOT EXISTS
-- ============================================================

ALTER TABLE diagnostics
  ADD COLUMN IF NOT EXISTS description_projet TEXT,
  ADD COLUMN IF NOT EXISTS extraction JSONB,
  ADD COLUMN IF NOT EXISTS nb_questions_posees INTEGER;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'diagnostics'
  AND column_name IN ('description_projet', 'extraction', 'nb_questions_posees')
ORDER BY column_name;
