# Veloprep

Bestel-, planning- en proceduretool voor Smiling Barista: event-agenda met
beschikbaarheid, briefings per event, en digitale checklists voor medewerkers.

## Opstarten (Fase 1)

1. **Supabase-project aanmaken**: ga naar [supabase.com](https://supabase.com),
   maak een gratis project in een **EU-regio** (bv. Frankfurt, voor GDPR).
2. Kopieer `.env.local.example` naar `.env.local` en vul in vanuit
   *Project Settings → API*:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (enkel server-side gebruikt, nooit committen)
3. **Database opzetten**: voer de migraties uit `supabase/migrations/` op
   volgorde uit in de Supabase SQL editor, gevolgd door `supabase/seed.sql`
   (de 5 checklist-templates).
4. **2FA**: in het Supabase-dashboard onder *Authentication → Providers →
   Multi-factor authentication*, zet TOTP aan.
5. **Eerste gebruikers**: maak accounts aan via *Authentication → Users* (of
   laat medewerkers zichzelf registreren als dat later wordt toegevoegd), en
   zet de eerste admin-rol via een SQL-update op `profiles.role`.
6. Installeer dependencies en start de dev-server:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Structuur

- `src/app/[locale]/...` — pagina's (NL/EN/FR/DE via `next-intl`)
- `src/lib/supabase/` — Supabase-clients (browser, server, admin/service-role)
- `src/lib/wix.ts` — workshopkalender van de website (Wix Bookings, alleen-lezen);
  vereist `WIX_API_KEY` (zie `.env.local.example`), zonder key verdwijnt de sectie
- `supabase/migrations/` — databaseschema + Row Level Security
- `supabase/seed.sql` — de 5 checklist-templates (Veloprep-uitrusting,
  Velopresso-opbouw, Menu, Bienvenue Santé & Bonne Route, Teambuilding Latte Art)

## Sales / Gmail

De adminpagina Leads zoekt rechtstreeks in Gmail naar e-mails met `offerte`,
`event`, `koffie`, `velopresso`, `workshop`, `teambuilding`, `coffee & smiles`
of `latte art` in onderwerp of inhoud. De app toont maximaal 25 gesprekken en
stuurt of wijzigt geen e-mails. Er is geen Notion-koppeling nodig.

Voor toegang: activeer de Gmail API in Google Cloud, maak OAuth-gegevens aan en
genereer met OAuth Playground een refresh token met de scope
`https://www.googleapis.com/auth/gmail.readonly`. Vul de client-ID, clientsecret
en refresh token server-side in als `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` en
`GMAIL_REFRESH_TOKEN` (in `.env.local` en de Vercel environment variables). Houd
de refresh token geheim; zet de OAuth-toestemmingsstatus niet op "Testing" voor
blijvende toegang, omdat Google testtokens na zeven dagen kan laten verlopen.
Voer ook `supabase/migrations/0014_customer_contacts.sql` en
`supabase/migrations/0015_sales_projects.sql` uit om contacten en aangepaste
projectnamen op te slaan. In Leads kun je afzendergegevens controleren; in
Projecten kun je de projectnaam wijzigen. De oorspronkelijke e-mail blijft
ongewijzigd.

Dagelijkse, wekelijkse en maandelijkse teamtaken zijn beschikbaar onder **Taken**.
Admins kiezen voor wekelijkse taken een weekdag en voor maandelijkse taken een
dag van de maand. Takenlijsten kunnen op eerstvolgende uitvoerdatum of in een
handmatige volgorde worden getoond; admins kunnen de handmatige volgorde aanpassen.
Afvinkstatus is gedeeld: dagelijks opent opnieuw om 05:00, wekelijks op maandag
om 05:00 en maandelijks op de gekozen dag om 05:00 in `Europe/Brussels`. Voer
`supabase/migrations/0016_recurring_tasks.sql` en
`supabase/migrations/0017_recurring_task_schedule.sql` uit.

## Vercel deploy (publieke URL)

Deze app is voorbereid voor Vercel-deploy:

1. Kies een GitHub-repo en link deze aan Vercel.
2. Selecteer het project in Vercel en zet de volgende environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Laat Vercel de Next.js-app builden met de standaardinstellingen.
4. Na deploy is de app publiek beschikbaar via de gegenereerde Vercel-URL.

## Fase 2 (later)

Voorraad-/historiekbeheer van handels- en hulpgoederen, Odoo Online-koppeling
(voorraad/inkoop eerst), en het inladen van verkoopvoorraad. Zie het plan in
`.claude/plans/` voor de volledige context.
