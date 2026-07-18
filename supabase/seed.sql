-- Veloprep — seed data voor de 5 checklist-templates
-- Bron: Connecteam-export (Veloprep-uitrusting, Velopresso opbouw, Menu,
-- Bienvenue Santé & Bonne Route, Teambuilding Latte Art), geanalyseerd 2026-07-18.

with t as (
  insert into checklist_templates (code) values ('veloprep_uitrusting') returning id
)
insert into checklist_template_items (template_id, section, label, sort_order)
select t.id, v.section, v.label, v.sort_order
from t, (values
  (null, 'Melk op de Velopresso (schuiven)', 1),
  (null, 'Melk reserve in camionette', 2),
  (null, '3 kg koffiebonen — + extra service-uren × 1 kg', 3),
  (null, 'Back-up koffie (+10%)', 4),
  (null, 'Melkkan 1 liter', 5),
  (null, 'Melkkan 600 ml', 6),
  (null, 'Melkkan 350–400 ml', 7),
  (null, 'Chai latte — pot gevuld', 8),
  (null, 'Matcha latte — pot gevuld', 9),
  (null, 'Chocolade — pot gevuld', 10),
  (null, 'Thee — pot gevuld', 11),
  (null, 'Water — vat/bidon in Velopresso', 12),
  (null, 'Water — reserve in camionette', 13),
  (null, 'Gasfles — werkende fles', 14),
  (null, 'Gasfles — reserve', 15),
  (null, 'Back-up grinder', 16),
  (null, 'Back-up espressomachine', 17)
) as v(section, label, sort_order);

with t as (
  insert into checklist_templates (code) values ('velopresso_opbouw') returning id
)
insert into checklist_template_items (template_id, section, label, sort_order)
select t.id, v.section, v.label, v.sort_order
from t, (values
  ('Velopresso', 'Staanplaats kiezen en Velopresso goed met logo in het zicht plaatsen', 1),
  ('Velopresso', 'Vijs de hendel op de machine', 2),
  ('Velopresso', 'Haal de sleeves van machine en molen', 3),
  ('Velopresso', 'Handrem opzetten en rem blokkeren', 4),
  ('Velopresso', 'Zet zo snel mogelijk de koffiemachine aan om op te warmen (gas 30 min, elektriciteit 15 min)', 5),
  ('Velopresso', 'Maalstand inschakelen: koppelingen vooraan in de fiets gelijk zetten', 6),
  ('Velopresso', 'Poten vooraan de fiets zetten', 7),
  ('Velopresso', 'Stuur losvijzen en onder werkblad rechts vastvijzen', 8),
  ('Espressomachine', 'Gas of elektriciteit selecteren', 9),
  ('Espressomachine', 'Gasfles opendraaien indien nodig', 10),
  ('Espressomachine', 'Electriciteit aansluiten indien nodig', 11),
  ('Espressomachine', 'Aan/uit knop onder machine (naar het zadel gericht is AAN)', 12),
  ('Espressomachine', 'Hendel monteren', 13),
  ('Espressomachine', 'Hopper op de molen', 14),
  ('Espressomachine', 'Vullen met bonen', 15),
  ('Werkplek', 'Tamper en mat klaarzetten', 16),
  ('Werkplek', 'Suiker, roerstaafjes en koekjes klaarzetten', 17),
  ('Werkplek', 'Handdoek portafilter links hangen', 18),
  ('Werkplek', 'Melk-vod op de tray en vodje op werkblad klaarleggen', 19),
  ('Werkplek', 'Portafilter in espressomachine, 2de portafilter op de machine, links in het 2de rondjes', 20),
  ('Werkplek', 'Weegschaal klaarzetten', 21),
  ('Werkplek', 'Bekers klaarzetten op machine', 22),
  ('Werkplek', 'Parasol opstellen', 23),
  ('Werkplek', 'Menukaart ophangen', 24),
  ('Werkplek', 'Koekjes klaarzetten', 25),
  ('Werkplek', 'Check de opstelling van de Velopresso', 26),
  ('Werkplek', 'Ben je al wat vroeger dan het startuur klaar om te serveren? Maak de mensen van de locatie al blij met een koffie en co', 27),
  ('Werkplek', 'En vooral: amuseerduweigen!', 28)
) as v(section, label, sort_order);

with t as (
  insert into checklist_templates (code) values ('menu') returning id
)
insert into checklist_template_items (template_id, section, label, sort_order)
select t.id, v.section, v.label, v.sort_order
from t, (values
  (null, 'Espresso', 1),
  (null, 'Americano', 2),
  (null, 'Cortado', 3),
  (null, 'Cappuccino', 4),
  (null, 'Flat White', 5),
  (null, 'Latte', 6),
  (null, 'Chaï Latte', 7),
  (null, 'Dirty Chaï', 8),
  (null, 'Matcha Vanilla Latte', 9),
  (null, 'Hot/Cold Chocolate', 10),
  (null, 'Tea (Black, Green, Fruit)', 11)
) as v(section, label, sort_order);

with t as (
  insert into checklist_templates (code) values ('bienvenue_sante_bonne_route') returning id
)
insert into checklist_template_items (template_id, section, label, sort_order)
select t.id, v.section, v.label, v.sort_order
from t, (values
  ('Aankomst', 'Camionette legaal parkeren', 1),
  ('Aankomst', 'Contactpersoon bellen (mogelijk is die nog niet zo vroeg wakker, geen stress)', 2),
  ('Aankomst', 'Dag zeggen en jezelf voorstellen aan het onthaal', 3),
  ('Aankomst', 'Vragen waar je de koffiefiets mag opstellen', 4),
  ('Aankomst', 'Zie checklist Velopresso Opbouw', 5),
  ('Vertrek', 'Zie checklist Velopresso Afbraak', 6),
  ('Vertrek', 'Camionette voorrijden en laden (zorg dat je niemand hindert indien mogelijk)', 7),
  ('Vertrek', 'Contactpersoon dag zeggen en bedanken voor het event', 8)
) as v(section, label, sort_order);

with t as (
  insert into checklist_templates (code) values ('teambuilding_latte_art') returning id
)
insert into checklist_template_items (template_id, section, label, sort_order)
select t.id, v.section, v.label, v.sort_order
from t, (values
  ('Tafel 1 — 2 oefenopstellingen', '2 onderleggers', 1),
  ('Tafel 1 — 2 oefenopstellingen', 'Leg 1 haspel en 1 verlengkabelblokje klaar', 2),
  ('Tafel 1 — 2 oefenopstellingen', 'Plaats 2 Dualits en vul bovenaan met gefilterd water', 3),
  ('Tafel 1 — 2 oefenopstellingen', '1 fles gefilterd water naast elke Dualit', 4),
  ('Tafel 1 — 2 oefenopstellingen', '2 drankdispensers vullen met kraantjeswater en 7 gram latte art liquid', 5),
  ('Tafel 1 — 2 oefenopstellingen', '2 nepspresso-pompjes', 6),
  ('Tafel 1 — 2 oefenopstellingen', '6 melkkannetjes 400 ml', 7),
  ('Tafel 1 — 2 oefenopstellingen', '10 cappuccino-tassen', 8),
  ('Tafel 1 — 2 oefenopstellingen', '3 melkvodjes', 9),
  ('Tafel 1 — 2 oefenopstellingen', '3 vodden', 10),
  ('Tafel 1 — 2 oefenopstellingen', '4 blauwe vloermatjes', 11),
  ('Tafel 3 — espressomachine', 'Espressomachine', 12),
  ('Tafel 3 — espressomachine', '10 cappuccino-tassen', 13),
  ('Tafel 3 — espressomachine', '6 latte-tassen', 14),
  ('Tafel 3 — espressomachine', 'Tamper', 15),
  ('Tafel 3 — espressomachine', 'Tampermatje', 16),
  ('Tafel 3 — espressomachine', 'Uitklopbak', 17),
  ('Tafel 3 — espressomachine', 'Pot chaï-poeder', 18),
  ('Tafel 3 — espressomachine', 'Pot Matcha-poeder', 19),
  ('Gietstation', '1 karretje als gietstation', 20),
  ('Gietstation', '1 grote mat om onder gietstation (karretje) te leggen', 21),
  ('Gietstation', '4 zwarte bakjes', 22)
) as v(section, label, sort_order);
