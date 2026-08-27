"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/auth";

const LOCALE_LABELS: Record<string, string> = {
  nl: "NL",
  en: "EN",
  fr: "FR",
  de: "DE",
};

const MAIN_LINKS = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/kalender", key: "calendar" },
  { href: "/checklists", key: "checklists" },
  { href: "/briefings", key: "briefings" },
  { href: "/voorraad", key: "inventory" },
] as const;

const ADMIN_LINKS = [
  { href: "/admin/checklists", key: "adminChecklists" },
  { href: "/admin/team", key: "adminTeam" },
  { href: "/admin/backup", key: "adminBackup" },
  { href: "/admin/archive", key: "adminArchive" },
] as const;

export function SiteHeader({ profile }: { profile: Profile | null }) {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const links = profile?.role === "admin" ? [...MAIN_LINKS, ...ADMIN_LINKS] : MAIN_LINKS;

  return (
    <header className="no-print border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/dashboard" className="order-1 flex items-center gap-2">
          <Image src="/logo.png" alt={common("appName")} width={36} height={36} />
          <span className="font-heading font-semibold text-brand">
            {common("appName")}
          </span>
        </Link>

        <div className="order-2 flex items-center gap-3 lg:order-3">
          <select
            aria-label={common("language")}
            value={locale}
            onChange={(e) => router.replace(pathname, { locale: e.target.value })}
            className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm"
          >
            {routing.locales.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l]}
              </option>
            ))}
          </select>
          {profile && (
            <button
              onClick={handleLogout}
              className="rounded bg-brand px-3 py-1 text-sm text-brand-foreground hover:opacity-90"
            >
              {t("logout")}
            </button>
          )}
        </div>

        {profile && (
          <nav className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-sm lg:order-2 lg:w-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap hover:text-brand"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
