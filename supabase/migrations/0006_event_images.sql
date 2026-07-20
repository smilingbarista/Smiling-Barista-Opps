-- Afbeeldingen per event (zichtbaar op de eventpagina en de briefing).

create table event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now()
);

alter table event_images enable row level security;

create policy "event_images_select_authenticated" on event_images
  for select using (auth.role() = 'authenticated');
create policy "event_images_write_admin" on event_images
  for all using (public.is_admin()) with check (public.is_admin());

-- Storage: bucket "event-images" wordt via de Storage API aangemaakt (niet via SQL).
-- Hieronder enkel de rij-beveiliging voor die bucket.
create policy "event_images_storage_select" on storage.objects
  for select using (bucket_id = 'event-images');
create policy "event_images_storage_insert_admin" on storage.objects
  for insert with check (bucket_id = 'event-images' and public.is_admin());
create policy "event_images_storage_delete_admin" on storage.objects
  for delete using (bucket_id = 'event-images' and public.is_admin());
