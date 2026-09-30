# Voorbeeld: veilige Vercel + Supabase setup voor beide repos

## 1. Veloprep repo

### Project

```text
Project: veloprep-prod
Repo: veloprep
Framework: Next.js
```

### Environment variables

Production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key_here
SUPABASE_SERVICE_ROLE_KEY=service_role_here
NEXT_PUBLIC_APP_URL=https://veloprep.example.com
```

Preview:

```env
NEXT_PUBLIC_SUPABASE_URL=https://staging-xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=staging_service_role_key
NEXT_PUBLIC_APP_URL=https://preview-veloprep.example.com
```

### Supabase setup

- eigen Supabase project voor Veloprep
- auth alleen voor medewerkers / admins
- RLS enabled
- service role key alleen in server-side code
- geen publieke write access

### Vercel setup

- project: veloprep-prod
- production domain: veloprep.example.com
- preview domain: veloprep-git-branch.example.com
- environment variables per env

---

## 2. Website repo

### Project

```text
Project: smiling-barista-website-prod
Repo: smiling-barista-website
Framework: Next.js
```

### Environment variables

Production:

```env
NEXT_PUBLIC_SITE_URL=https://www.example.com
NEXT_PUBLIC_CONTACT_EMAIL=info@example.com
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/yourpage
```

Preview:

```env
NEXT_PUBLIC_SITE_URL=https://preview-example.com
NEXT_PUBLIC_CONTACT_EMAIL=info@example.com
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/yourpage
```

### Supabase setup

- website hoeft geen Supabase-credentials te hebben
- als je een contactformulier wilt opslaan, gebruik een aparte API of apart project
- anders: geen database in website repo

### Vercel setup

- project: smiling-barista-website-prod
- production domain: www.example.com
- preview urls: preview.example.com of branch-preview
- environment variables alleen voor publieke website

---

## 3. Veiligheidsregels

### Niet doen

- geen gedeelde Vercel-project
- geen gedeelde Supabase project
- geen gedeelde `.env` bestanden
- geen gebruik van service role in client-side code
- geen private auth data in website repo

### Wel doen

- een repo per app
- een project per app
- een database per app
- environment variables per app
- review op deploy voordat productie

---

## 4. Eenvoudige conclusie

```text
Veloprep repo -> Veloprep Vercel project -> Veloprep Supabase project
Website repo -> Website Vercel project -> no Supabase or separate public DB
```

Zolang de website geen private business data hoeft te verwerken, is deze setup het veiligst en het eenvoudigst te onderhouden.
