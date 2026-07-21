import { redirect } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { GroupedEventList } from "@/components/grouped-event-list";
import type { EventBriefingPrintedRow } from "@/lib/types";

const EVENT_SELECT =
  "*, briefing_printed_by_profile:profiles!briefing_printed_by(full_name)";

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("archive");
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    redirect({ href: "/dashboard", locale });
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .lt("event_date", today)
    .order("event_date", { ascending: false });
  const events = (data ?? []) as unknown as EventBriefingPrintedRow[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <GroupedEventList
        events={events}
        locale={locale}
        order="desc"
        emptyMessage={t("noEvents")}
      />
    </div>
  );
}
