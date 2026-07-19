-- Zachte "verwijdering" van checklist-template-items: i.p.v. hard delete kan
-- een admin een item deactiveren (doorstreept in het beheerscherm, en wordt
-- niet meer meegekopieerd naar nieuwe event-checklists).

alter table checklist_template_items
  add column active boolean not null default true;
