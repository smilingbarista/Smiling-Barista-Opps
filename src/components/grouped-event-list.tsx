import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { groupEventsByMonthAndWeek } from "@/lib/group-events";
import { formatTime } from "@/lib/event-display";
import type { EventBriefingPrintedRow } from "@/lib/types";

export async function GroupedEventList({
  events,
  locale,
  order = "asc",
  emptyMessage,
}: {
  events: EventBriefingPrintedRow[];
  locale: string;
  order?: "asc" | "desc";
  emptyMessage: string;
}) {
  const eventT = await getTranslations("event");
  const commonT = await getTranslations("common");

  if (events.length === 0) {
    return <p className="text-sm text-black/50">{emptyMessage}</p>;
  }

  const months = groupEventsByMonthAndWeek(events, order);
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {months.map(({ monthKey, weeks }) => {
        const [year, month] = monthKey.split("-").map(Number);
        const monthLabel = monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
        return (
          <div key={monthKey} className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold text-brand">
              {monthLabel}
            </h2>
            {weeks.map(({ weekNumber, events: weekEvents }) => (
              <div key={weekNumber} className="flex gap-3">
                <div className="w-14 shrink-0 pt-1 text-xs text-black/40">
                  {commonT("week")} {weekNumber}
                </div>
                <ul className="flex flex-1 flex-col gap-2">
                  {weekEvents.map((event) => {
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
                                name:
                                  event.briefing_printed_by_profile?.full_name ?? "",
                                date: new Date(
                                  event.briefing_printed_at,
                                ).toLocaleString(locale),
                              })}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
