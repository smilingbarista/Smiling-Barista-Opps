-- Verbruiksrapport per event: koffiebonen (kg of aantal hoppers), liter melk,
-- en welke niet-koffiedranken opvallend populair waren. Eén gedeeld rapport
-- per event (net als event_checklists), in te vullen door een toegewezen
-- barista of admin.
create table event_usage_reports (
  event_id uuid primary key references events (id) on delete cascade,
  coffee_kg numeric,
  coffee_hoppers numeric,
  milk_liters numeric,
  popular_non_coffee_drinks text,
  submitted_by uuid references profiles (id) on delete set null,
  submitted_at timestamptz,
  updated_at timestamptz
);

alter table event_usage_reports enable row level security;

create policy "event_usage_reports_select_authenticated" on event_usage_reports
  for select using (auth.role() = 'authenticated');
create policy "event_usage_reports_write_assigned_or_admin" on event_usage_reports
  for all
  using (public.is_admin() or public.is_assigned_to_event(event_id))
  with check (public.is_admin() or public.is_assigned_to_event(event_id));
