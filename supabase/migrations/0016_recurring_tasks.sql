create table recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  frequency text not null check (frequency in ('daily', 'weekly')),
  sort_order int not null default 0,
  active boolean not null default true,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table recurring_task_completions (
  task_id uuid not null references recurring_tasks (id) on delete cascade,
  period_start date not null,
  completed_by uuid references profiles (id) on delete set null,
  completed_at timestamptz not null default now(),
  primary key (task_id, period_start)
);

alter table recurring_tasks enable row level security;
alter table recurring_task_completions enable row level security;

create policy "recurring_tasks_select_authenticated" on recurring_tasks
  for select using (auth.role() = 'authenticated');
create policy "recurring_tasks_write_admin" on recurring_tasks
  for all using (public.is_admin()) with check (public.is_admin());

create policy "recurring_task_completions_select_authenticated" on recurring_task_completions
  for select using (auth.role() = 'authenticated');
create policy "recurring_task_completions_insert_authenticated" on recurring_task_completions
  for insert with check (auth.uid() = completed_by);
create policy "recurring_task_completions_update_authenticated" on recurring_task_completions
  for update using (auth.role() = 'authenticated')
  with check (auth.uid() = completed_by);
create policy "recurring_task_completions_delete_authenticated" on recurring_task_completions
  for delete using (auth.role() = 'authenticated');