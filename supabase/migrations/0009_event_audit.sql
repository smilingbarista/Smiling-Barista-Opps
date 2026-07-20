-- Houdt bij wanneer een event laatst gewijzigd is en door wie, naast de
-- al bestaande created_at/created_by. Zichtbaar onderaan de eventpagina.

alter table events add column updated_at timestamptz;
alter table events add column updated_by uuid references profiles (id) on delete set null;
