-- Voorraadbeheer: materialen en grondstoffen, aanpasbaar als inventaris.

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  quantity numeric not null default 0,
  unit text,
  created_at timestamptz not null default now()
);

alter table inventory_items enable row level security;

create policy "inventory_items_select_authenticated" on inventory_items
  for select using (auth.role() = 'authenticated');
create policy "inventory_items_write_admin" on inventory_items
  for all using (public.is_admin()) with check (public.is_admin());
