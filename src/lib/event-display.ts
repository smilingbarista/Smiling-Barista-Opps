import type { EventRow } from "@/lib/types";
import { formatBaristaSuffix } from "@/lib/event-title";

export function formatTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

// Standaardblauw voor events, en een lichter blauw voor teambuildings.
export const EVENT_COLOR = "#0366c5";
export const TEAMBUILDING_COLOR = "#5b9bd5";

export function isTeambuildingEvent(title: string): boolean {
  return title.toLowerCase().includes("teambuilding");
}

export function eventColor(title: string): string {
  return isTeambuildingEvent(title) ? TEAMBUILDING_COLOR : EVENT_COLOR;
}

type EventWithBaristaStatus = Pick<
  EventRow,
  | "title"
  | "service_start"
  | "service_end"
  | "barista_names"
  | "barista_confirmed"
  | "barista_tentative_other_job"
  | "pending"
>;

// Titel met service-uren ervoor en barista-status erachter, bv.
// "10:00–14:00 Woezi (Lynn — bevestigd)".
export function eventTitleWithTime(e: EventWithBaristaStatus): string {
  const start = formatTime(e.service_start);
  const end = formatTime(e.service_end);
  const timePrefix = start && end ? `${start}–${end} ` : start ? `${start} ` : "";
  return `${timePrefix}${e.title}${formatBaristaSuffix(e)}`;
}
