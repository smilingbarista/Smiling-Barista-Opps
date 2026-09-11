-- Multiple dates per event, with service hours per date.
create table event_dates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  event_date date not null,
  service_start time,
  service_end time,
  created_at timestamptz not null default now(),
  unique (event_id, event_date)
);

alter table event_dates enable row level security;

create policy "event_dates_select_authenticated" on event_dates
  for select using (auth.role() = 'authenticated');
create policy "event_dates_write_admin" on event_dates
  for all using (public.is_admin()) with check (public.is_admin());