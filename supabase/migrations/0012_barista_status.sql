-- Barista-naam en -status verhuizen van de vrije titel-tekst (waar ze via
-- haakjes-parsing werden in- en uitgelezen, en corrupt raakten zodra de
-- basistitel zelf haakjes bevatte) naar echte kolommen. `title` blijft na de
-- bijhorende backfill enkel nog de kale basistitel.
alter table events
  add column barista_names text[] not null default '{}',
  add column barista_confirmed boolean not null default false,
  add column barista_tentative_other_job boolean not null default false,
  add column pending boolean not null default false;
