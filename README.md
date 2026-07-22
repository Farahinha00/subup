# SubventionsPME Maroc

Portail SaaS B2B d'orientation vers les subventions publiques marocaines.  
Stack : Next.js 15 (App Router) · Tailwind CSS · Supabase (Auth + Postgres + RLS) · Vercel

---

## Lancer en local

### 1. Prérequis

- Node.js ≥ 18
- Un projet Supabase créé sur [supabase.com](https://supabase.com)

### 2. Installer les dépendances

```bash
cd subventions-maroc
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplissez `.env.local` avec vos valeurs Supabase (Settings > API) :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Initialiser la base de données

Dans Supabase Studio > SQL Editor, exécutez dans cet ordre :

1. **`supabase/schema.sql`** — tables, triggers, RLS
2. **`supabase/seed.sql`** — 5 dispositifs initiaux

### 5. Créer votre compte admin

1. Inscrivez-vous via `/inscription`
2. Dans Supabase Studio > Table Editor > `profiles`, trouvez votre ligne et changez `role` de `user` à `admin`
3. Accédez à `/admin`

### 6. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Déployer sur Vercel + Supabase

### Supabase (production)
1. Créez un projet Supabase en production
2. Exécutez `schema.sql` puis `seed.sql` dans le SQL Editor
3. Dans Authentication > URL Configuration : ajoutez votre domaine Vercel comme "Site URL"
4. Dans Authentication > Email Templates : personnalisez si souhaité

### Vercel
1. Importez le repo sur [vercel.com](https://vercel.com)
2. Ajoutez les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Déployez

---

## Ajouter un 6e dispositif

Tout se passe dans Supabase sans redéploiement.

### Via SQL Editor

```sql
insert into dispositifs (
  slug, nom, organisme, type_aide,
  montant_max, taux,
  regles, documents_requis,
  delai_indicatif, lien_officiel, derniere_verification, actif
) values (
  'mon-dispositif',
  'Nom du dispositif',
  'Organisme porteur',
  'Description du type d''aide',
  5000000,   -- montant max en MAD
  30,        -- taux en %
  '{
    "version": 1,
    "criteres": [
      {
        "id": "mon_critere",
        "label": "Description du critère",
        "type": "enum_includes",
        "champ": "statut_juridique",
        "valeurs": ["SARL", "SA"],
        "bloquant": true,
        "message_echec": "Message affiché si critère non validé"
      }
    ]
  }',
  '["Document 1", "Document 2"]',
  '2 à 3 mois',
  'https://lien-officiel.ma',
  '2026-07-01',
  true
);
```

### Types de critères disponibles

| `type` | Champs requis | Exemple |
|---|---|---|
| `boolean` | `champ`, `valeur` | `autofinancement_ok = true` |
| `enum_includes` | `champ`, `valeurs[]` | `statut_juridique in ['SARL', 'SA']` |
| `enum_excludes` | `champ`, `valeurs[]` | `secteur not in ['alcool_tabac']` |
| `range` | `champ`, `min?`, `max?` | `montant_projet between 1M and 50M` |
| `min_value` | `champ`, `valeur` | `score >= 60` |

### Champs disponibles dans les réponses

| Champ | Type | Valeurs possibles |
|---|---|---|
| `statut_juridique` | string | `SARL`, `SA`, `auto-entrepreneur`, `pas encore créée` |
| `annee_creation` | number | ex : `2019` |
| `secteur` | string | `industrie`, `services`, `TIC`, `agro`, `artisanat`, `tourisme`, `economie_verte`, `alcool_tabac`, `immobilier_residentiel`, `autre` |
| `region` | string | 12 régions du Maroc |
| `effectif` | string | `0`, `1-5`, `6-20`, `20+` |
| `ca_annuel` | number | Converti en MAD : `0`, `100000`, `1000000`, `10000000`, `50000000` |
| `type_projet` | string | `creation`, `extension`, `digitalisation`, `innovation`, `export` |
| `montant_projet` | number | Converti en MAD (même table que `ca_annuel`) |
| `autofinancement_ok` | boolean | `true` / `false` |
| `emplois_prevus` | string | `0`, `1-5`, `6-20`, `20+` |
| `situation_administrative` | string | `oui`, `non`, `en_cours` |
| `aide_anterieure` | boolean | `true` / `false` |
| `capital_independant` | boolean | `true` / `false` |
| `province_eligible_territoriale` | boolean | Calculé automatiquement depuis `region` |

---

## Modifier une règle existante

Pour mettre à jour les critères d'un dispositif sans redéployer :

```sql
update dispositifs
set
  regles = '{ ... nouveau JSONB ... }',
  derniere_verification = '2026-07-01'
where slug = 'charte-tpme';
```

> **Important** : mettez toujours à jour `derniere_verification` pour tracer vos mises à jour.

---

## Structure du projet

```
src/
├── app/
│   ├── page.tsx                    # Landing
│   ├── diagnostic/page.tsx         # Wizard 3 étapes
│   ├── inscription/page.tsx
│   ├── connexion/page.tsx
│   ├── tableau-de-bord/page.tsx    # Espace utilisateur
│   ├── resultats/[id]/page.tsx     # Résultats détaillés
│   ├── admin/page.tsx              # Back-office
│   └── api/
│       ├── matching/route.ts       # Moteur de matching (POST)
│       └── auth/callback/route.ts  # Callback OAuth Supabase
├── components/
│   ├── wizard/                     # WizardEtape1/2/3, ProgressBar
│   ├── resultats/CarteDispositif   # Carte résultat avec détails
│   └── layout/Header, Footer
├── lib/
│   ├── supabase/client.ts          # Client navigateur
│   ├── supabase/server.ts          # Client serveur (SSR)
│   ├── matching/engine.ts          # Moteur de règles JSONB
│   └── labels.ts                   # Labels FR + tables de conversion
└── types/index.ts                  # Types TypeScript
```

---

## Ajouter l'arabe (v2)

Tous les labels sont dans `src/lib/labels.ts`. Pour ajouter l'arabe :
1. Dupliquer la structure dans `src/lib/labels.ar.ts`
2. Ajouter un sélecteur de langue dans le Header
3. Passer la locale via Context ou props

---

## Feature flag pays actifs

Le portail supporte plusieurs pays (MA, FR) mais n'en expose qu'une partie en public via la table `config_app`.

### Activer / désactiver un pays

```sql
-- Maroc uniquement (défaut)
UPDATE config_app SET valeur = '["MA"]' WHERE cle = 'pays_actifs';

-- Réactiver la France
UPDATE config_app SET valeur = '["MA","FR"]' WHERE cle = 'pays_actifs';
```

Aucun redéploiement requis — la landing, le wizard et l'admin relisent la config à chaque requête.

> Les données (dispositifs FR, diagnostics FR existants) ne sont jamais supprimées par ce flag — le masquage est purement côté affichage. Les utilisateurs ayant déjà des diagnostics France peuvent toujours les consulter dans leur tableau de bord.

---

## Supprimer définitivement un pays (opération irréversible)

> **Ne pas exécuter avant d'avoir pris une décision définitive.** Cette opération détruit les données de matching et les dispositifs du pays concerné. Les diagnostics et profils utilisateurs sont conservés (anonymisés).

**Étapes :**

1. Mettre le pays hors ligne via le feature flag (voir ci-dessus).
2. Vérifier qu'aucune demande d'accompagnement en cours ne référence ce pays.
3. Exécuter le script SQL ci-dessous dans Supabase SQL Editor.

```sql
-- ============================================================
-- SUPPRESSION DÉFINITIVE DU PAYS 'FR'
-- Remplacer 'FR' par le code pays à supprimer si nécessaire.
-- ============================================================

-- 1. Supprimer les résultats liés aux dispositifs du pays
DELETE FROM resultats
WHERE dispositif_id IN (
  SELECT id FROM dispositifs WHERE pays = 'FR'
);

-- 2. Supprimer les demandes d'accompagnement liées
DELETE FROM demandes_accompagnement
WHERE dispositif_id IN (
  SELECT id FROM dispositifs WHERE pays = 'FR'
);

-- 3. Supprimer les dispositifs du pays
DELETE FROM dispositifs WHERE pays = 'FR';

-- 4. Anonymiser les diagnostics du pays (conservation du profil utilisateur)
--    On supprime les réponses détaillées mais on garde la ligne et la date
--    pour les stats. Adapter ou supprimer complètement selon les besoins RGPD.
UPDATE diagnostics
SET reponses = '{"pays": "FR", "anonymised": true}'::jsonb
WHERE pays = 'FR';

-- 5. Retirer le pays de la config (si pas déjà fait)
UPDATE config_app
SET valeur = (
  SELECT jsonb_agg(val)
  FROM jsonb_array_elements_text(valeur) val
  WHERE val != 'FR'
)
WHERE cle = 'pays_actifs';
```

---

## Sources officielles à vérifier

Les critères d'éligibilité sont indicatifs. Vérifiez avant mise en production :

- **Charte TPME** : [cri-invest.ma](https://www.cri-invest.ma) · Décret n°2-25-342 · BO n°7454 (06/11/2025)
- **MOWAKABA / ISTITMAR** : [marocpme.gov.ma](https://www.marocpme.gov.ma)
- **Innov Invest** : [ccg.ma](https://www.ccg.ma)
- **Digital PME** : [add.gov.ma](https://www.add.gov.ma)
