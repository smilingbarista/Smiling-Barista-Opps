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

  return (
    <header className="no-print border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt={common("appName")} width={36} height={36} />
          <span className="font-heading font-semibold text-brand">
            {common("appName")}
          </span>
        </Link>

        {profile && (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-brand">
              {t("dashboard")}
            </Link>
            <Link href="/kalender" className="hover:text-brand">
              {t("calendar")}
            </Link>
            <Link href="/checklists" className="hover:text-brand">
              {t("checklists")}
            </Link>
            <Link href="/voorraad" className="hover:text-brand">
              {t("inventory")}
            </Link>
            {profile.role === "admin" && (
              <>
                <Link href="/admin/checklists" className="hover:text-brand">
                  {t("adminChecklists")}
                </Link>
                <Link href="/admin/team" className="hover:text-brand">
                  {t("adminTeam")}
                </Link>
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
