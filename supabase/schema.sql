-- ============================================================
-- SCHÉMA SUPABASE — Portail Subventions Maroc
-- À exécuter dans l'éditeur SQL de Supabase (Settings > SQL Editor)
-- ============================================================

-- Extension uuid si pas déjà activée
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------
-- TABLE : profiles
-- ----------------------------------------------------------
create table if not exists profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  prenom      text,
  nom         text,
  telephone   text,
  ville       text,
  entreprise  text,
  role        text        not null default 'user'
                          check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

-- Trigger : créer un profil vide à chaque inscription
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ----------------------------------------------------------
-- TABLE : dispositifs
-- ----------------------------------------------------------
create table if not exists dispositifs (
  id                    uuid        primary key default gen_random_uuid(),
  slug                  text        unique not null,
  nom                   text        not null,
  organisme             text        not null,
  type_aide             text        not null,
  montant_max           integer,
  taux                  integer,
  regles                jsonb       not null,
  documents_requis      jsonb       not null default '[]',
  delai_indicatif       text,
  lien_officiel         text,
  derniere_verification date,
  actif                 boolean     not null default true
);

-- ----------------------------------------------------------
-- TABLE : diagnostics
-- ----------------------------------------------------------
create table if not exists diagnostics (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  reponses    jsonb       not null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------
-- TABLE : resultats
-- ----------------------------------------------------------
create table if not exists resultats (
  id                  uuid    primary key default gen_random_uuid(),
  diagnostic_id       uuid    not null references diagnostics(id) on delete cascade,
  dispositif_id       uuid    not null references dispositifs(id),
  score               integer not null check (score between 0 and 100),
  statut              text    not null check (statut in ('eligible', 'probable', 'non_eligible')),
  criteres_ok         jsonb   not null default '[]',
  criteres_manquants  jsonb   not null default '[]',
  criteres_bloquants  jsonb   not null default '[]'
);

-- ----------------------------------------------------------
-- TABLE : demandes_accompagnement
-- ----------------------------------------------------------
create table if not exists demandes_accompagnement (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references profiles(id) on delete cascade,
  diagnostic_id   uuid        not null references diagnostics(id),
  dispositif_id   uuid        not null references dispositifs(id),
  message         text,
  statut          text        not null default 'nouvelle'
                              check (statut in ('nouvelle', 'contactee', 'signee', 'perdue')),
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------
alter table profiles               enable row level security;
alter table diagnostics            enable row level security;
alter table resultats              enable row level security;
alter table demandes_accompagnement enable row level security;
alter table dispositifs            enable row level security;

-- Helper is_admin()
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles
drop policy if exists "profiles_policy" on profiles;
create policy "profiles_policy" on profiles
  for all using (id = auth.uid() or is_admin());

-- diagnostics
drop policy if exists "diagnostics_policy" on diagnostics;
create policy "diagnostics_policy" on diagnostics
  for all using (user_id = auth.uid() or is_admin());

-- resultats (via diagnostic)
drop policy if exists "resultats_policy" on resultats;
create policy "resultats_policy" on resultats
  for all using (
    exists (
      select 1 from diagnostics d
      where d.id = diagnostic_id
        and (d.user_id = auth.uid() or is_admin())
    )
  );

-- demandes_accompagnement
drop policy if exists "demandes_policy" on demandes_accompagnement;
create policy "demandes_policy" on demandes_accompagnement
  for all using (user_id = auth.uid() or is_admin());

-- dispositifs : lecture publique pour actifs, écriture admin
drop policy if exists "dispositifs_read" on dispositifs;
drop policy if exists "dispositifs_admin_write" on dispositifs;
create policy "dispositifs_read" on dispositifs
  for select using (actif = true or is_admin());
create policy "dispositifs_admin_write" on dispositifs
  for all using (is_admin());

-- ----------------------------------------------------------
-- INDEX utiles
-- ----------------------------------------------------------
create index if not exists idx_diagnostics_user_id     on diagnostics(user_id);
create index if not exists idx_resultats_diagnostic_id on resultats(diagnostic_id);
create index if not exists idx_demandes_user_id        on demandes_accompagnement(user_id);
create index if not exists idx_demandes_statut         on demandes_accompagnement(statut);
