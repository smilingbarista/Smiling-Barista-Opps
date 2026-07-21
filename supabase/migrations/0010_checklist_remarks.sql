-- Eén opmerkingenveld per checklist-invulling (i.p.v. per item), voor
-- checklists die geen per-item "Extra"-veld tonen.
alter table event_checklists add column remarks text;
