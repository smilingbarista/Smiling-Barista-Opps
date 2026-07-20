import { redirect } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { BackupButton } from "@/components/backup-button";

export default async function AdminBackupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("backup");
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    redirect({ href: "/dashboard", locale });
  }

  const supabase = await createClient();
  const { data: backups } = await supabase
    .from("backups")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-black/60">{t("intro")}</p>

      <BackupButton />

      {(!backups || backups.length === 0) && (
        <p className="text-sm text-black/50">{t("noBackups")}</p>
      )}

      <ul className="flex flex-col gap-2">
        {(backups ?? []).map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between rounded border border-black/10 px-4 py-2 text-sm"
          >
            <span>
              {new Date(b.created_at).toLocaleString(locale)}
              <span className="ml-2 text-xs text-black/40">
                ({b.triggered_by === "cron" ? t("automatic") : t("manualLabel")})
              </span>
            </span>
            <a
              href={`/api/backup/download/${b.path}`}
              className="text-brand underline"
            >
              {t("download")}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
