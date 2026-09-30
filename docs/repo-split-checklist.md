# Checklist: eerste repo split

Gebruik deze checklist voordat je de website en Veloprep opsplitst.

## 1. Bepaal de grenzen

- [ ] Veloprep is het interne product met planning, teams en private data
- [ ] Website is publiek en marketinggericht
- [ ] Geen gedeelde user sessions
- [ ] Geen gedeelde database voor productie

## 2. Scheid de code

- [ ] Veloprep repo bevat alleen interne app code
- [ ] Website repo bevat alleen publieke landing pages en content
- [ ] Geen imports van website-componenten in Veloprep
- [ ] Geen private Veloprep-routes in de website repo

## 3. Scheid config en secrets

- [ ] Nieuwe `.env.local` in het Veloprep repo
- [ ] Nieuwe `.env.local` in het website repo
- [ ] Geen gedeelde API keys
- [ ] Geen gedeelde database URL
- [ ] Geen gedeelde Supabase project

## 4. Scheid deployment

- [ ] Veloprep heeft eigen Vercel-project
- [ ] Website heeft eigen Vercel-project
- [ ] Elke omgeving heeft eigen URL
- [ ] Preview-omgeving is apart
- [ ] Production-omgeving is apart

## 5. Scheid data access

- [ ] Veloprep gebruikt eigen Supabase project of schema
- [ ] Website gebruikt geen private database
- [ ] Forms of API routes zijn goed gescheiden
- [ ] Private routes zijn niet toegankelijk via de website

## 6. Controleer voordat je gaat deployen

- [ ] `npm run build` werkt in beide repos
- [ ] Env variables zijn gecontroleerd
- [ ] Geen geheimen in Git history
- [ ] README beschrijft install en deployment
- [ ] Team weet welke repo bij welke app hoort

## 7. Korte default keuze

Als je niet zeker weet:

- [ ] Veloprep blijft altijd in eigen repo
- [ ] Website blijft altijd in eigen repo
- [ ] Geen “one repo to rule them all”

## Eindevoorwaarde

De split is succesvol als:

- beide repos onafhankelijk kunnen draaien
- beide repos eigen deploys hebben
- beide repos eigen secrets hebben
- geen code of data van de ene app per ongeluk in de andere app zit
