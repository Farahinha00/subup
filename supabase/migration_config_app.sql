-- ============================================================
-- Feature flag : pays actifs
-- À exécuter une seule fois — idempotent
-- ============================================================

-- Table de configuration applicative (clé/valeur JSONB)
create table if not exists config_app (
  id     serial    primary key,
  cle    text      unique not null,
  valeur jsonb     not null,
  updated_at timestamptz default now()
);

-- Trigger updated_at
create or replace function set_config_app_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trig_config_app_updated_at on config_app;
create trigger trig_config_app_updated_at
  before update on config_app
  for each row execute procedure set_config_app_updated_at();

-- RLS : lecture publique (anonyme), écriture admin seulement
alter table config_app enable row level security;

drop policy if exists "config_app_lecture_publique" on config_app;
create policy "config_app_lecture_publique" on config_app
  for select using (true);

drop policy if exists "config_app_ecriture_admin" on config_app;
create policy "config_app_ecriture_admin" on config_app
  for all using (is_admin());

-- Valeur initiale : Maroc uniquement (France masquée)
-- Pour réactiver la France : UPDATE config_app SET valeur = '["MA","FR"]' WHERE cle = 'pays_actifs';
insert into config_app (cle, valeur)
values ('pays_actifs', '["MA"]'::jsonb)
on conflict (cle) do nothing;
