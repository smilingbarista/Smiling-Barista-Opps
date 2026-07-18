import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { EventRow } from "@/lib/types";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let events: EventRow[] = [];
  let pendingChecklists = 0;

  if (profile?.role === "admin") {
    const { data } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", today)
      .order("event_date", { ascending: true });
    events = data ?? [];

    const { count } = await supabase
      .from("event_checklists")
      .select("id", { count: "exact", head: true })
      .eq("status", "ingediend");
    pendingChecklists = count ?? 0;
  } else if (profile) {
    const { data } = await supabase
      .from("event_assignments")
      .select("events(*)")
      .eq("profile_id", profile.id);
    events = ((data ?? []) as unknown as { events: EventRow | null }[])
      .map((row) => row.events)
      .filter((e): e is EventRow => !!e)
      .filter((e) => e.event_date >= today)
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

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">
          {profile?.role === "admin" ? t("allEvents") : t("myEvents")}
        </h2>
        {events.length === 0 && (
          <p className="text-sm text-black/50">{t("noEvents")}</p>
        )}
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="block rounded border border-black/10 px-4 py-3 hover:border-brand"
              >
                <span className="font-medium">{event.title}</span>
                <span className="ml-2 text-sm text-black/50">
                  {event.event_date}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
