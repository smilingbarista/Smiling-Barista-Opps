create policy "recurring_tasks_insert_authenticated" on recurring_tasks
  for insert
  with check (
    auth.uid() = created_by
    and auth.role() = 'authenticated'
  );