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
3. **Database opzetten**: voer de SQL uit `supabase/migrations/0001_init.sql`
   uit in de Supabase SQL editor, gevolgd door `supabase/seed.sql` (de 5
   checklist-templates).
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
- `supabase/migrations/` — databaseschema + Row Level Security
- `supabase/seed.sql` — de 5 checklist-templates (Veloprep-uitrusting,
  Velopresso-opbouw, Menu, Bienvenue Santé & Bonne Route, Teambuilding Latte Art)

## Fase 2 (later)

Voorraad-/historiekbeheer van handels- en hulpgoederen, Odoo Online-koppeling
(voorraad/inkoop eerst), en het inladen van verkoopvoorraad. Zie het plan in
`.claude/plans/` voor de volledige context.
