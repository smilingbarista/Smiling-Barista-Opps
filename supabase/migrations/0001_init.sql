-- Veloprep — Fase 1 schema
-- Rollen, events, beschikbaarheid en checklists.

create extension if not exists pgcrypto;

create type user_role as enum ('admin', 'medewerker');
create type availability_status as enum ('beschikbaar', 'niet_beschikbaar');
create type checklist_status as enum ('open', 'ingediend');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role user_role not null default 'medewerker',
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    'medewerker'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- events (briefing-velden, cf. voorbeeld "Lynn naar The 7th C")
-- ---------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  departure_time time,
  transport_duration text,
  arrival_time time,
  service_start time,
  service_end time,
  departure_end_time time,
  end_time time,
  address text,
  description text,
  guest_count text,
  contact_name text,
  contact_phone text,
  setup text,
  menu text,
  pastry text,
  breakfast text,
  personalization_items text,
  personalization_extra text,
  logistics_flow text,
  status text not null default 'gepland',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table event_assignments (
  event_id uuid not null references events (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  primary key (event_id, profile_id)
);

create function public.is_assigned_to_event(p_event_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.event_assignments
    where event_id = p_event_id and profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- availability
-- ---------------------------------------------------------------------------
create table availability (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null,
  status availability_status not null,
  note text,
  unique (profile_id, date)
);

-- ---------------------------------------------------------------------------
-- checklist templates + items (master data, cf. Connecteam-export)
-- ---------------------------------------------------------------------------
create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
);

create table checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_templates (id) on delete cascade,
  section text,
  label text not null,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- event_checklists (kopie per event, cf. "KOPIEER DEZE DRAFT PER NIEUW EVENT")
-- ---------------------------------------------------------------------------
create table event_checklists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  template_id uuid not null references checklist_templates (id),
  status checklist_status not null default 'open',
  submitted_by uuid references profiles (id) on delete set null,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table event_checklist_items (
  id uuid primary key default gen_random_uuid(),
  event_checklist_id uuid not null references event_checklists (id) on delete cascade,
  template_item_id uuid not null references checklist_template_items (id),
  checked boolean not null default false,
  note text
);

create function public.can_edit_event_checklist(p_event_checklist_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select public.is_admin() or exists (
    select 1
    from public.event_checklists ec
    where ec.id = p_event_checklist_id
      and public.is_assigned_to_event(ec.event_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table events enable row level security;
alter table event_assignments enable row level security;
alter table availability enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_template_items enable row level security;
alter table event_checklists enable row level security;
alter table event_checklist_items enable row level security;

-- profiles: iedereen ziet eigen profiel, admin ziet/beheert alles
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own_or_admin" on profiles
  for update using (auth.uid() = id or public.is_admin());
create policy "profiles_delete_admin" on profiles
  for delete using (public.is_admin());

-- events: alle ingelogde medewerkers lezen, enkel admin beheert
create policy "events_select_authenticated" on events
  for select using (auth.role() = 'authenticated');
create policy "events_write_admin" on events
  for insert with check (public.is_admin());
create policy "events_update_admin" on events
  for update using (public.is_admin());
create policy "events_delete_admin" on events
  for delete using (public.is_admin());

-- event_assignments: lezen voor iedereen, beheren door admin
create policy "assignments_select_authenticated" on event_assignments
  for select using (auth.role() = 'authenticated');
create policy "assignments_write_admin" on event_assignments
  for all using (public.is_admin()) with check (public.is_admin());

-- availability: eigen rijen beheren, admin ziet/beheert alles
create policy "availability_select_own_or_admin" on availability
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "availability_write_own_or_admin" on availability
  for all
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- checklist templates/items: lezen voor iedereen, beheren door admin
create policy "templates_select_authenticated" on checklist_templates
  for select using (auth.role() = 'authenticated');
create policy "templates_write_admin" on checklist_templates
  for all using (public.is_admin()) with check (public.is_admin());
create policy "template_items_select_authenticated" on checklist_template_items
  for select using (auth.role() = 'authenticated');
create policy "template_items_write_admin" on checklist_template_items
  for all using (public.is_admin()) with check (public.is_admin());

-- event_checklists: lezen voor iedereen, wijzigen door toegewezen medewerker of admin
create policy "event_checklists_select_authenticated" on event_checklists
  for select using (auth.role() = 'authenticated');
create policy "event_checklists_insert_assigned_or_admin" on event_checklists
  for insert with check (public.is_admin() or public.is_assigned_to_event(event_id));
create policy "event_checklists_update_assigned_or_admin" on event_checklists
  for update using (public.is_admin() or public.is_assigned_to_event(event_id));
create policy "event_checklists_delete_admin" on event_checklists
  for delete using (public.is_admin());

-- event_checklist_items: lezen voor iedereen, wijzigen door toegewezen medewerker of admin
create policy "event_checklist_items_select_authenticated" on event_checklist_items
  for select using (auth.role() = 'authenticated');
create policy "event_checklist_items_write_assigned_or_admin" on event_checklist_items
  for all
  using (public.can_edit_event_checklist(event_checklist_id))
  with check (public.can_edit_event_checklist(event_checklist_id));
