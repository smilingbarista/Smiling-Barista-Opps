import { getIsoWeek } from "@/lib/iso-week";

export type WeekGroup<T> = { weekNumber: number; events: T[] };
export type MonthGroup<T> = { monthKey: string; weeks: WeekGroup<T>[] };

// Groepeert events per maand (YYYY-MM) en, binnen elke maand, per ISO-weeknummer.
// De volgorde van maanden/weken/events volgt allemaal dezelfde `order`.
export function groupEventsByMonthAndWeek<T extends { event_date: string }>(
  events: T[],
  order: "asc" | "desc" = "asc",
): MonthGroup<T>[] {
  const sorted = [...events].sort((a, b) =>
    order === "asc"
      ? a.event_date.localeCompare(b.event_date)
      : b.event_date.localeCompare(a.event_date),
  );

  const monthMap = new Map<string, Map<number, T[]>>();
  for (const e of sorted) {
    const monthKey = e.event_date.slice(0, 7);
    const week = getIsoWeek(e.event_date);
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, new Map());
    const weekMap = monthMap.get(monthKey)!;
    if (!weekMap.has(week)) weekMap.set(week, []);
    weekMap.get(week)!.push(e);
  }

  const monthKeys = Array.from(monthMap.keys()).sort((a, b) =>
    order === "asc" ? a.localeCompare(b) : b.localeCompare(a),
  );

  return monthKeys.map((monthKey) => {
    const weekMap = monthMap.get(monthKey)!;
    // Sorteren op de eerste datum in elke week-groep (i.p.v. het rauwe
    // weeknummer), zodat een jaarovergang begin januari niet uit volgorde ligt.
    const weeks = Array.from(weekMap.entries())
      .map(([weekNumber, weekEvents]) => ({ weekNumber, events: weekEvents }))
      .sort((a, b) =>
        order === "asc"
          ? a.events[0].event_date.localeCompare(b.events[0].event_date)
          : b.events[0].event_date.localeCompare(a.events[0].event_date),
      );
    return { monthKey, weeks };
  });
}
