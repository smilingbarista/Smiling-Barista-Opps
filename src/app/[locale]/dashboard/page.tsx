import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { NewEventForm } from "@/components/new-event-form";
import { formatTime } from "@/lib/event-display";
import type { EventBriefingPrintedRow } from "@/lib/types";

const EVENT_SELECT =
  "*, briefing_printed_by_profile:profiles!briefing_printed_by(full_name)";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard");
  const eventT = await getTranslations("event");
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let events: EventBriefingPrintedRow[] = [];
  let pendingChecklists = 0;

  if (profile?.role === "admin") {
    const { data } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .gte("event_date", today)
      .neq("status", "gearchiveerd")
      .order("event_date", { ascending: true });
    events = (data ?? []) as unknown as EventBriefingPrintedRow[];

    const { count } = await supabase
      .from("event_checklists")
      .select("id", { count: "exact", head: true })
      .eq("status", "ingediend");
    pendingChecklists = count ?? 0;
  } else if (profile) {
    const { data } = await supabase
      .from("event_assignments")
      .select(`events(${EVENT_SELECT})`)
      .eq("profile_id", profile.id);
    events = (
      (data ?? []) as unknown as {
        events: EventBriefingPrintedRow | null;
      }[]
    )
      .map((row) => row.events)
      .filter((e): e is EventBriefingPrintedRow => !!e)
      .filter((e) => e.event_date >= today && e.status !== "gearchiveerd")
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>

      {profile?.role === "admin" && pendingChecklists > 0 && (
        <p className="rounded bg-brand/10 px-4 py-2 text-sm text-brand">
          {t("pendingChecklists")}: {pendingChecklists}
        </p>
      )}

      {profile?.role === "admin" && <NewEventForm />}

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">
          {profile?.role === "admin" ? t("allEvents") : t("myEvents")}
        </h2>
        {events.length === 0 && (
          <p className="text-sm text-black/50">{t("noEvents")}</p>
        )}
        <ul className="flex flex-col gap-2">
          {events.map((event) => {
            const start = formatTime(event.service_start);
            const end = formatTime(event.service_end);
            const hours = start && end ? `${start}–${end}` : start;
            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="flex flex-col gap-1 rounded border border-black/10 px-4 py-3 hover:border-brand"
                >
                  <span className="flex items-center justify-between">
                    <span>
                      <span className="font-medium">{event.title}</span>
                      <span className="ml-2 text-sm text-black/50">
                        {event.event_date}
                      </span>
                    </span>
                    {hours && (
                      <span className="text-sm text-black/50">{hours}</span>
                    )}
                  </span>
                  {event.briefing_printed_at && (
                    <span className="text-xs text-black/40">
                      {eventT("briefingPrintedBy", {
                        name: event.briefing_printed_by_profile?.full_name ?? "",
                        date: new Date(event.briefing_printed_at).toLocaleString(
                          locale,
                        ),
                      })}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
