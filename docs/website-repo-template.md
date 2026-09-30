# Website repo template

Dit is het sjabloon voor een volledig zelfstandig website-project.

## Repo naam

```text
smiling-barista-website
```

## Basisstructuur

```text
smiling-barista-website/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    header.tsx
    footer.tsx
    hero.tsx
  lib/
    site-config.ts
  public/
    og-image.jpg
    icons/
  .env.example
  .gitignore
  package.json
  next.config.ts
  tsconfig.json
  postcss.config.mjs
  README.md
```

## package.json

```json
{
  "name": "smiling-barista-website",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "16.2.10",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.10"
  }
}
```

## .env.example

```env
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_CONTACT_EMAIL=info@example.com
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/yourprofile
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/yourprofile
```

## .gitignore

```gitignore
node_modules
.next
out
.env.local
.env.production
.env
npm-debug.log*
.DS_Store
```

## README.md

```md
# Smiling Barista Website

Public marketing website for Smiling Barista.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Production

Deploy this repo as a separate Vercel project.
Do not share environment variables with Veloprep.
```

## Voorbeeld van homepage

```tsx
export default function HomePage() {
  return (
    <main>
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>

      <section>
        <h1>Smiling Barista</h1>
        <p>Fresh coffee experiences for events and teams.</p>
      </section>
    </main>
  );
}
```

## Belangrijk

Deze repo bevat alleen publieke, niet-private content. Als je een formulier hebt dat met data werkt, zet dat in het juiste project en gebruik een aparte API of een aparte backend.
