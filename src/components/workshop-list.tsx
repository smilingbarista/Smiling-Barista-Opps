import { getTranslations } from "next-intl/server";
import { getWorkshopSessions } from "@/lib/wix";

function monthLabel(locale: string, monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function dayLabel(locale: string, date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export async function WorkshopList({ locale }: { locale: string }) {
  const t = await getTranslations("workshops");
  const sessions = await getWorkshopSessions();

  if (sessions.length === 0) return null;

  const byMonth = new Map<string, typeof sessions>();
  for (const session of sessions) {
    const key = session.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(session);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">{t("title")}</h2>
      <div className="flex flex-col gap-4">
        {[...byMonth.entries()].map(([monthKey, monthSessions]) => (
          <div key={monthKey} className="flex flex-col gap-2">
            <h3 className="font-heading text-sm font-semibold text-brand">
              {monthLabel(locale, monthKey)}
            </h3>
            <ul className="flex flex-col gap-2">
              {monthSessions.map((session) => {
                const spots =
                  session.openSpots != null
                    ? session.openSpots > 0
                      ? t("spotsLeft", { count: session.openSpots })
                      : t("full")
                    : null;
                return (
                  <li key={session.id}>
                    <a
                      href={session.bookingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col gap-1 rounded border border-black/10 px-4 py-3 hover:border-brand"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-x-2">
                        <span className="font-semibold text-brand">
                          {session.title}
                        </span>
                        <span className="text-sm text-black/50">
                          {dayLabel(locale, session.date)}
                          {session.startTime
                            ? ` · ${session.startTime}${
                                session.endTime ? `–${session.endTime}` : ""
                              }`
                            : ""}
                        </span>
                      </span>
                      <span className="text-xs text-black/40">
                        {[
                          spots,
                          session.locationName?.replace(
                            /^Smiling Barista\s+/i,
                            "",
                          ) ?? null,
                          session.instructors.join(", ") || null,
                        ]
                          .filter(Boolean)
                          .join(" — ")}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
