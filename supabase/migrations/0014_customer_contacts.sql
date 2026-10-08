create table customer_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text not null unique,
  phone text,
  source_thread_id text,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table customer_contacts enable row level security;

create policy "customer_contacts_admin_all" on customer_contacts
  for all using (public.is_admin()) with check (public.is_admin());