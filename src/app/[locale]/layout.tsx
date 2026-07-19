import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Raleway } from "next/font/google";
import localFont from "next/font/local";
import { routing } from "@/i18n/routing";
import { getCurrentProfile } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import "../globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const jellee = localFont({
  src: "../fonts/Jellee-Roman.otf",
  variable: "--font-jellee",
});

export const metadata: Metadata = {
  title: "Veloprep",
  description: "Bestel-, planning- en proceduretool voor Smiling Barista",
  manifest: "/manifest.json",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const profile = await getCurrentProfile();

  return (
    <html lang={locale} className={`${raleway.variable} ${jellee.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <SiteHeader profile={profile} />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
