// Basis-URL van de app, gebruikt voor redirect-links in e-mails
// (bv. uitnodigingen). Vercel zet VERCEL_URL automatisch op elke deployment.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3411";
}
