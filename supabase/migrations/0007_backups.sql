-- Dagelijkse/handmatige PDF-backups, enkel zichtbaar/beheerbaar door admins.

create table backups (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  created_at timestamptz not null default now(),
  triggered_by text not null default 'manual'
);

alter table backups enable row level security;

create policy "backups_select_admin" on backups
  for select using (public.is_admin());
create policy "backups_write_admin" on backups
  for all using (public.is_admin()) with check (public.is_admin());

-- Storage: bucket "backups" wordt via de Storage API aangemaakt (privé).
create policy "backups_storage_select_admin" on storage.objects
  for select using (bucket_id = 'backups' and public.is_admin());
create policy "backups_storage_insert_admin" on storage.objects
  for insert with check (bucket_id = 'backups' and public.is_admin());
