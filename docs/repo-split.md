# Aanbevolen setup: twee losse repos

Deze repo is het beste als een apart project voor Veloprep. De website hoort in een volledig eigen repository te staan.

## Doel

- Veloprep blijft een afgesloten product met eigen data, auth en deploy
- De website blijft publieke, marketing-georiënteerde code zonder toegang tot klantdata
- Geen gedeelde .env, geen gedeelde database, geen gedeelde auth

## Structuur

### Repo 1: veloprep

```text
veloprep/
  app/
  src/
  supabase/
  public/
  .env.local
  .env.example
  package.json
  README.md
```

Gebruik voor:
- planning
- medewerkers
- checklists
- beheer
- private data
- Supabase-project voor Veloprep

### Repo 2: website

```text
smiling-barista-website/
  src/
  app/
  public/
  .env.local
  .env.example
  package.json
  README.md
```

Gebruik voor:
- homepage
- landingpages
- algemene informatie
- contact / forms
- publieke content
- afzonderlijke deploy

## Belangrijkste beveiligingsregels

1. Geen gedeelde `.env.local`
2. Geen gedeelde Supabase URL of API keys
3. Geen gedeelde auth session
4. Geen gedeelde production database
5. Elk repo heeft eigen deploy secrets
6. Alleen publieke website code mag naar de website repo

## Environment variables

### Veloprep repo

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Website repo

```env
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_CONTACT_EMAIL=info@example.com
```

Als de website niets met Supabase doet, hoeft die repo geen Supabase-variabelen te krijgen.

## Deploy-strategie

### Veloprep
- Vercel project: veloprep-prod
- preview environment voor dev/staging
- environment variables per omgeving

### Website
- eigen Vercel project: website-prod
- eigen preview environment
- eigen domain / subdomain

## Git workflow

```bash
git checkout -b feature/website-homepage
# website repo

git checkout -b feature/veloprep-calendar
# veloprep repo
```

Gebruik nooit code van de website in de Veloprep-repo, tenzij dat echt onderdeel is van de business flow.

## Aanbevolen keuze

Voor jouw situatie is de veiligste en meest praktische keuze:

- Veloprep = eigen repo
- Website = eigen repo
- geen gedeelde database
- geen gedeelde secrets
- geen gedeelde deploy environment

## Eenvoudige conclusie

Twee losse repos is de juiste keuze als je echt wilt voorkomen dat website-werk of deploy-werk invloed heeft op Veloprep of vice versa.
