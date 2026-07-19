-- Checklist-items op een event worden niet langer gekopieerd bij het koppelen
-- van een template; ze worden live berekend uit de actieve template-items.
-- event_checklist_items is nu een sparse "status-tabel": enkel een rij per
-- item dat effectief al is afgevinkt/genoteerd.

alter table event_checklist_items
  add constraint event_checklist_items_unique
  unique (event_checklist_id, template_item_id);
