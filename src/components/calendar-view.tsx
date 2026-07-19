"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "@/i18n/navigation";
import type { EventRow, AvailabilityRow } from "@/lib/types";

export function CalendarView({
  events,
  availability,
  onDateClick,
}: {
  events: EventRow[];
  availability: AvailabilityRow[];
  onDateClick?: (date: string) => void;
}) {
  const router = useRouter();

  const eventSources = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.event_date,
      allDay: true,
      color: "#0366c5",
    })),
    ...availability.map((a) => ({
      id: `avail-${a.id}`,
      title: a.status === "beschikbaar" ? "✓" : "✕",
      start: a.date,
      allDay: true,
      display: "background",
      color: a.status === "beschikbaar" ? "#16a34a33" : "#dc262633",
    })),
  ];

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      height="auto"
      locale="nl"
      events={eventSources}
      dateClick={
        onDateClick ? (info) => onDateClick(info.dateStr) : undefined
      }
      eventClick={(info) => {
        if (info.event.id.startsWith("avail-")) return;
        router.push(`/events/${info.event.id}`);
      }}
    />
  );
}
