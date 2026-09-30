# Analyse van de Veloprep-app

_Opgesteld op 2026-08-27. Onderwerp: de interne Veloprep-applicatie in de repo-root (`src/`, `supabase/`). Design en visuele styling vallen buiten scope en worden later toegevoegd._

---

## 1. Context en positionering

Veloprep is de **interne bestel-, planning- en proceduretool** van Smiling Barista (juridisch: Alles Onder Control BV). Het is een aparte app van de publieke marketingsite in [`apps/website/`](../apps/website/docs/website-analyse.md).

| | Veloprep (deze app) | Website (`apps/website`) |
|---|---|---|
| Doel | interne operatie: agenda, briefings, checklists, voorraad | publieke marketing |
| Publiek | medewerkers (barista's) en admins | prospecten, klanten |
| Auth | Supabase Auth + verplichte 2FA (TOTP) | geen |
| Data | Supabase Postgres met Row Level Security | geen database |
| Talen | NL (default), EN, FR, DE via `next-intl` | enkel NL |
| Hosting | eigen Vercel-project + eigen Supabase (EU-regio, GDPR) | eigen Vercel-project |

**Fase 1** (huidige scope): event-agenda met beschikbaarheid, briefings per event, digitale checklists, voorraad, verbruiksrapporten, back-ups.

> **Update 2026-08-27:** de sales-/CRM-module (`/sales`, `/api/crm-projects`, Notion-koppeling, e-mail-whitelist) is volledig verwijderd. Verwijzingen ernaar hieronder zijn geschrapt.
**Fase 2** (later, nog niet gebouwd): voorraad-/historiekbeheer van handels- en hulpgoederen, Odoo Online-koppeling. `.env.local.example` bevat al lege `ODOO_*`-variabelen.

---

## 2. Opbouw (technisch)

### Stack
- **Next.js 16.2.10**, **React 19.2.4**, **App Router**, **TypeScript** `strict`
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — auth, Postgres, Storage
- **next-intl 4** — routering en vertalingen voor 4 locales
- **Tailwind CSS 4** (via `@tailwindcss/postcss`) — utility-classes, geïmporteerd in `globals.css`
- **@ducanh2912/next-pwa** — service worker, offline-caching, `manifest.json`
- **FullCalendar 6** (`daygrid` + `interaction`) — kalenderweergave met drag-and-drop
- **jsPDF** — PDF-generatie voor briefings en back-ups
- **idb** — IndexedDB-wrapper voor de offline wachtrij van checklists

### Monorepo
De repo-root is zowel de Veloprep-app **als** een npm-workspace-root (`workspaces: ["apps/*"]`). De website leeft in `apps/website`. De `docs/`-map beschrijft de bedoeling om beide uiteindelijk in **losse repositories** te splitsen (`repo-split.md`, `repo-split-checklist.md`).

### Projectstructuur
```
src/
  app/
    [locale]/              # alle UI-routes, per taal
      layout.tsx           # root layout: fonts, header, NextIntlClientProvider
      page.tsx             # redirect → /dashboard of /login
      login/  auth/        # authenticatie (login, wachtwoord, 2FA-enrollment)
      dashboard/           # startscherm
      kalender/            # FullCalendar + beschikbaarheid
      events/[id]/         # event-detail, briefing, checklists per event
      briefings/           # overzicht briefings
      checklists/          # checklists van de ingelogde medewerker
      voorraad/            # inventaris
      privacy/             # GDPR-pagina (publiek)
      admin/               # checklists, team, backup, archive (admin-only)
    api/
      backup/generate      # Vercel Cron (dagelijkse PDF-backup)
      backup/download/[...path]
      admin/export/[profileId]   # GDPR data-export
    globals.css
    fonts/                 # Jellee-Roman.otf (lokale display-font)
  components/              # 27 componenten, waarvan 30 "use client" markeringen*
  i18n/                    # routing.ts, request.ts, navigation.ts
  lib/                     # auth, supabase-clients, PDF, offline-queue, helpers, types
  messages/                # nl/en/fr/de.json (elk 14 top-level secties)
  middleware.ts            # locale-routing + auth-gate
supabase/
  migrations/0001…0012     # schema + RLS, incrementeel
  seed.sql                 # de 5 checklist-templates
```
_\* 30 bestanden bevatten `"use client"` inclusief enkele in `app/`; er zijn 27 bestanden in `components/`._

### Rendering-model
- **Server Components + Server Actions** als hoofdpatroon. Pagina's halen data server-side op met de Supabase-server-client; mutaties gebeuren via `actions.ts`-bestanden met `"use server"` (8 stuks).
- Elke action herhaalt de autorisatiecheck (`getCurrentProfile()` → `role`) en roept daarna `revalidatePath()` aan.
- **Client Components** enkel waar interactie nodig is (formulieren, kalender, modals, taalwissel, autosize-textarea).
- **Drie Supabase-clients**, strikt gescheiden: `client.ts` (browser), `server.ts` (RSC/actions, met cookie-afhandeling), `admin.ts` (service-role, enkel server, voor GDPR-verwijdering en cron-backups).

---

## 3. Structuur (informatie-architectuur)

### Navigatie
Eén header (`site-header.tsx`), zichtbaar na login, met rolafhankelijke links:

| Link | Zichtbaar voor | Route |
|---|---|---|
| Dashboard | iedereen | `/dashboard` |
| Kalender | iedereen | `/kalender` |
| Checklists | iedereen | `/checklists` |
| Briefings | iedereen | `/briefings` |
| Voorraad | iedereen | `/voorraad` |
| Beheer: checklists / team / backup / archief | admin | `/admin/*` |

Plus: taalkeuze (NL/EN/FR/DE `<select>`) en logout-knop.

### Rollen
Twee rollen (`user_role` enum): **`admin`** en **`medewerker`**.
- **medewerker (barista):** ziet enkel eigen toegewezen events, beheert eigen beschikbaarheid, vult toegewezen checklists en verbruiksrapporten in, markeert briefings als afgedrukt.
- **admin:** beheert events, wijst personeel toe, beheert checklist-templates, team (uitnodigen, rol wijzigen, GDPR-verwijderen), back-ups en archief.

### Auth-flow
1. `middleware.ts` draait `next-intl`-middleware + haalt de Supabase-user op. Niet-ingelogd + niet-publieke route → redirect naar `/{locale}/login`. Publiek: `/`, `login`, `privacy`, `auth/set-password`, `auth/forgot-password`.
2. Nieuwe gebruiker: admin nodigt uit → `auth/set-password` → `auth/mfa-enroll` (verplichte TOTP).
3. `handle_new_user()` trigger maakt automatisch een `profiles`-rij aan (rol default `medewerker`).

### Datamodel (Postgres)
Kern uit `0001_init.sql`, uitgebreid tot en met `0012`:

| Tabel | Rol | Belangrijke velden |
|---|---|---|
| `profiles` | 1-op-1 met `auth.users` | `full_name`, `email`, `phone`, `role` |
| `events` | het centrale object | tijdlijn (vertrek/aankomst/service/einde), adres, contact, `setup`, `menu`, `pastry`, `breakfast`, personalisatie, `logistics_flow`, `status`, briefing-print-audit, `barista_names[]`, `barista_confirmed`, `pending` |
| `event_assignments` | koppeltabel event ↔ medewerker | |
| `availability` | beschikbaarheid per medewerker per dag | `status` (`beschikbaar`/`niet_beschikbaar`), `note`, uniek per (profiel, datum) |
| `checklist_templates` + `checklist_template_items` | master-data, admin-beheerd | `section`, `label`, `sort_order`, `active` (soft delete), `extra` (instructie) |
| `event_checklists` + `event_checklist_items` | invulling per event | sinds `0003` **live berekend** uit actieve template-items; items-tabel is een sparse status-tabel; `status` (`open`/`ingediend`), `remarks` |
| `inventory_items` | voorraad | `name`, `category`, `quantity`, `unit` |
| `event_images` | foto's per event (in briefing) | Supabase Storage bucket `event-images` |
| `event_usage_reports` | verbruik per event | `coffee_kg`, `coffee_hoppers`, `milk_liters`, `popular_non_coffee_drinks` |
| `backups` | PDF-back-ups | Storage bucket `backups` (privé), `triggered_by` (`manual`/`cron`) |

**Row Level Security** staat op elke tabel. Kernregels:
- Lezen van events/assignments/templates/checklists: elke geauthenticeerde gebruiker.
- Schrijven van events/templates/inventory: enkel admin (`public.is_admin()`).
- `availability`: eigen rijen of admin.
- `event_checklists`/`event_checklist_items`: schrijven door toegewezen medewerker of admin (`public.is_assigned_to_event()`, `public.can_edit_event_checklist()`).
- `backups`: enkel admin.
- Enkele acties draaien via `security definer`-functies (`mark_briefing_printed`) zodat een gewone medewerker één specifieke kolom mag updaten zonder volledige write-toegang op `events`.

### Migratie-geschiedenis (wat het product leert over zichzelf)
De 12 migraties tonen de evolutie: soft delete van template-items (`0002`), overstap van gekopieerde naar live-berekende checklists (`0003`), per-item instructies (`0004`), voorraad (`0005`), event-foto's (`0006`), back-ups (`0007`), briefing-print-audit (`0008`), event-wijzigingsaudit (`0009`), checklist-opmerkingen (`0010`), verbruiksrapporten (`0011`), en het verplaatsen van barista-naam/-status van geparste titel-tekst naar echte kolommen (`0012` — expliciet om corruptie bij haakjes in titels op te lossen).

---

## 4. Functionele modules

### Dashboard (`/dashboard`)
Rolafhankelijk startscherm. Admin: aankomende, niet-gearchiveerde events + teller "ingediende checklists". Medewerker: enkel eigen toegewezen events. Admin ziet ook het `NewEventForm`.

### Kalender (`/kalender`)
FullCalendar-maandweergave. Events als klikbare entries, beschikbaarheid als achtergrond-events. Admin kan events verslepen naar een nieuwe datum (`rescheduleEvent`). Medewerkers zetten hun beschikbaarheid per dag (`setAvailability`, upsert). Bij het aanmaken van een event wordt automatisch een checklist gekoppeld: `teambuilding_latte_art` als de titel "teambuilding" bevat, anders `veloprep_uitrusting`.

### Event-detail (`/events/[id]`)
Het rijkste scherm. Bewerkbare titel, tijdlijn en briefing-velden (admin), barista-toewijzing en -status, foto's, gekoppelde checklists met status, en het verbruiksrapport. Medewerkers zien alles read-only behalve checklists/verbruik/briefing-print.

### Briefing (`/events/[id]/briefing`)
Printbare/PDF-versie van een event met eigen `generateMetadata` (titel = "Briefing {event}"). Waarschuwt wanneer gebak nog moet worden opgehaald (keyword-match op afhaalpunten zoals "bakkerij", "nona", "antoinette"). `mark_briefing_printed` logt wie en wanneer.

### Checklists (`/checklists`, `/events/[id]/checklists/[checklistId]`)
Live berekend uit de actieve template-items. Afvinken + per-item of globale opmerking. **Offline-first:** wijzigingen gaan via een IndexedDB-wachtrij (`lib/offline-queue.ts`), die bij herverbinding wordt geflusht. De service worker cachet event-pagina's (`NetworkFirst`, 7 dagen).

### Voorraad (`/voorraad`)
Inventaris van materialen en grondstoffen: naam, categorie, hoeveelheid, eenheid. Admin bewerkt, iedereen leest.

### Beheer (`/admin/*`)
- **checklists:** templates en items beheren (toevoegen, herordenen, deactiveren, `extra`-instructie).
- **team:** leden uitnodigen (`invite-team-member-form`), rol wijzigen, GDPR-verwijderen (service-role) + data-export via `/api/admin/export/[profileId]`.
- **backup:** handmatig een PDF-back-up genereren + downloaden; lijst van back-ups.
- **archive:** gearchiveerde events terugzien.

### Back-up (cron)
`vercel.json` roept dagelijks om 03:00 UTC `/api/backup/generate` aan, beveiligd met `CRON_SECRET` bearer-token, service-role-client, PDF via `jspdf` naar de privé `backups`-bucket.

---

## 5. Internationalisatie

- 4 locales: `nl` (default), `en`, `fr`, `de`. Routing via pad-prefix (`/nl/…`).
- Berichten in `src/messages/{locale}.json`, **14 top-level secties** in alle vier de bestanden (structureel in sync). Grootste sectie: `event` (63 sleutels).
- Server: `getTranslations()`. Client: `useTranslations()` via `NextIntlClientProvider`.
- Taalwissel in de header via `router.replace(pathname, { locale })`.
- Enum-waarden in de database zijn **Nederlands** (`beschikbaar`, `ingediend`, `gepland`, `gearchiveerd`) — de UI-laag vertaalt, de datalaag niet.

---

## 6. Stijl (code- en opmaakstijl)

_Visueel design blijft buiten scope._

### CSS / theming
- **Tailwind 4**, geïmporteerd via `@import "tailwindcss"` in `globals.css`. Geen `tailwind.config` — thema via `@theme inline`.
- **Design-tokens** als CSS-variabelen: `--brand` (`#0366c5`, blauw), `--brand-foreground`, `--background`, `--foreground`. Dark-mode-tokens via `prefers-color-scheme` (maar de UI-classes gaan grotendeels uit van licht).
- **Twee fonts:** `Raleway` (Google, `--font-raleway`, body) en `Jellee-Roman` (lokale `.otf`, `--font-jellee`, koppen en knoppen). Koppen krijgen automatisch `--brand`-kleur.
- **Micro-interacties** in `globals.css`: knoppen en kalender-events schalen op hover (`scale(1.05)`) en drukken in bij active. Print-media: `.no-print` verbergt navigatie.
- Layout in de pagina's: veel `flex flex-col gap-*`, `max-w-5xl` container, utility-classes inline.

### TypeScript / React-conventies
- Dubbele quotes, puntkomma's, 2-spaties-indentatie (Prettier + `eslint-config-next`).
- Pagina's zijn `async` Server Components; `params` is een `Promise` (Next 16) en wordt `await`-ed.
- Veel `as unknown as XxxRow`-casts rond Supabase-query's — de join-resultaten worden niet automatisch getypeerd, dus types uit `lib/types.ts` worden er handmatig overheen gelegd.
- Nederlandse foutmeldingen in server-actions (`"Titel en datum zijn verplicht"`), soms Engelse (`"Only admins can create events"`) — gemengd.
- Commentaar in de code en migraties is **Nederlands** en uitleggend ("waarom", niet "wat") — bv. de reden achter `security definer` of de checklist-refactor.

---

## 7. Inhoud en schrijfwijze

### UI-teksten (`messages/*.json`)
- Toon: zakelijk, kort, functioneel. Nederlandse UI met `je`-vorm waar van toepassing.
- Domeinwoordenschat is sterk bedrijfsspecifiek: _Velopresso_ (de fietskoffiebar), _Veloprep-uitrusting_, _briefing_, _afhaalpunt_, _hoppers_, _teambuilding latte art_.
- De 5 checklist-templates (uit een Connecteam-export van 2026-07-18): Veloprep-uitrusting, Velopresso-opbouw, Menu, Bienvenue Santé & Bonne Route, Teambuilding Latte Art.

### Checklist-inhoud (`seed.sql`)
Zeer concreet en operationeel: "Melk op de Velopresso (schuiven)", "3 kg koffiebonen — + extra service-uren × 1 kg", "Zet zo snel mogelijk de koffiemachine aan om op te warmen (gas 30 min, elektriciteit 15 min)", "Staanplaats kiezen en Velopresso goed met logo in het zicht plaatsen". Dit is gedestilleerde praktijkkennis, geen generieke tekst.

### Documentatie
- `README.md`: opstartgids (Supabase-project, `.env.local`, migraties, 2FA, eerste admin), structuur, Vercel-deploy, Fase 2.
- `AGENTS.md` / `CLAUDE.md`: waarschuwing dat deze Next.js-versie breaking changes heeft t.o.v. trainingsdata — lees `node_modules/next/dist/docs/` vóór het schrijven van code.
- `.env.local.example`: Supabase-keys, `NEXT_PUBLIC_SITE_URL`, en lege Odoo-variabelen voor Fase 2.

### Schrijfwijze samengevat
- De operationele NL-tekst (checklists, briefings, commentaar) is warm, direct en praktijkgericht.
- Consistente NL-commentaarcultuur in code en SQL, met nadruk op het *waarom* van beslissingen.
- Foutmeldingen en enum-waarden mengen NL en EN.

---

## 8. Beveiliging en GDPR

- **Auth-gate** in middleware + herhaalde rolcheck in elke server-action en API-route (defense in depth).
- **RLS op elke tabel**; service-role-key enkel server-side, met expliciete waarschuwing in `admin.ts`.
- **Verplichte 2FA** (TOTP) bij enrollment.
- **EU-regio Supabase** (Frankfurt) omwille van GDPR; privacy-pagina publiek toegankelijk.
- **Data-export** per gebruiker (`/api/admin/export/[profileId]`) en account-verwijdering via service-role.
- **Cron-endpoint** beveiligd met `CRON_SECRET` bearer-token.

---

## 9. Aandachtspunten

- **Veel `as unknown as`-casts** rond Supabase-joins — brosse typeveiligheid; een gewijzigde `select` breekt niet bij compile-tijd.
- **`getSiteUrl()` fallback is `http://localhost:3411`**, terwijl de README `:3000` gebruikt — inconsistente poort-aanname.
- **Geen automatische tests** en geen CI-config in de repo.
- **`.env.local` is aanwezig in de working tree** (staat wel in `.gitignore`) — controleren dat er nooit secrets in de history zijn beland vóór de repo-split.
- **Locale in `middleware` matcht** met een losse regex op `segments[0]`; dubbele logica voor "strip locale" die ook in andere helpers voorkomt.

---

## 10. Samenvattend beeld

Veloprep is een **volwassen, doordacht intern hulpmiddel**: strak Next 16 / RSC / Server-Actions-patroon, Supabase met consequente RLS, verplichte 2FA, GDPR-bewust (EU-regio, export, verwijdering, dagelijkse back-ups), meertalig, en offline-bestendig voor het scenario dat ertoe doet (checklists afvinken op locatie zonder netwerk). De 12 migraties en de NL-commentaarcultuur laten zien dat het product iteratief is gegroeid vanuit echte praktijk (Connecteam-export, briefing-voorbeeld "Lynn naar The 7th C").

**Sterk:**
- Heldere scheiding van verantwoordelijkheden (drie Supabase-clients, rol-gebaseerde toegang op meerdere lagen).
- Datamodel dicht bij het domein; live-berekende checklists vermijden kopie-drift.
- Veiligheid als gewoonte, niet als bijzaak.
- Rijke, concrete operationele inhoud in de seed-data.

**Losse eindjes (los van visueel design):**
- Typeveiligheid rond Supabase-query's verstevigen (gegenereerde types of een querylaag).
- Poort-/site-URL-fallbacks gelijktrekken.
- Tests en CI toevoegen vóór de repo-split (`docs/repo-split-checklist.md`).
- Controleren dat er geen secrets in de git-history zitten.
