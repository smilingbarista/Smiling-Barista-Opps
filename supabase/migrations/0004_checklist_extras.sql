-- Extra-veld per template-item (instructie, aanpasbaar door admin) en een
-- optionele naam per event-checklist (bv. "Veloprep 'Event X 18/07/2026'").

alter table checklist_template_items
  add column extra text;

alter table event_checklists
  add column name text;
