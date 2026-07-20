-- Houdt bij wie de briefing van een event als laatst heeft afgedrukt, en
-- wanneer. Zichtbaar op de eventpagina en in de events-lijst.

alter table events add column briefing_printed_at timestamptz;
alter table events add column briefing_printed_by uuid references profiles (id) on delete set null;

-- Elke ingelogde medewerker mag deze markeren (niet enkel de admin), vandaar
-- een security definer functie i.p.v. de admin-only update-policy op events.
create function public.mark_briefing_printed(p_event_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.events
  set briefing_printed_at = now(),
      briefing_printed_by = auth.uid()
  where id = p_event_id;
end;
$$;
