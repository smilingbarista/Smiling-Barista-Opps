create table sales_projects (
  gmail_thread_id text primary key,
  project_name text not null,
  original_subject text,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sales_projects enable row level security;

create policy "sales_projects_admin_all" on sales_projects
  for all using (public.is_admin()) with check (public.is_admin());