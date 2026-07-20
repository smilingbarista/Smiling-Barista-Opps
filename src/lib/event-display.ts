import type { EventRow } from "@/lib/types";

export function formatTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

// Titel met service-uren ervoor, bv. "10:00–14:00 Woezi (Lynn)".
export function eventTitleWithTime(e: Pick<EventRow, "title" | "service_start" | "service_end">): string {
  const start = formatTime(e.service_start);
  const end = formatTime(e.service_end);
  if (start && end) return `${start}–${end} ${e.title}`;
  if (start) return `${start} ${e.title}`;
  return e.title;
}
