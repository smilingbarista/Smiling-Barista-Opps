"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "@/i18n/navigation";
import { rescheduleEvent } from "@/app/[locale]/kalender/actions";
import type { EventRow, AvailabilityRow } from "@/lib/types";

function formatTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

function eventTitle(e: EventRow): string {
  const start = formatTime(e.service_start);
  const end = formatTime(e.service_end);
  if (start && end) return `${start}–${end} ${e.title}`;
  if (start) return `${start} ${e.title}`;
  return e.title;
}

export function CalendarView({
  events,
  availability,
  onDateClick,
  isAdmin,
}: {
  events: EventRow[];
  availability: AvailabilityRow[];
  onDateClick?: (date: string) => void;
  isAdmin?: boolean;
}) {
  const router = useRouter();

  const eventSources = [
    ...events.map((e) => ({
      id: e.id,
      title: eventTitle(e),
      start: e.event_date,
      allDay: true,
      color: "#0366c5",
      editable: !!isAdmin,
    })),
    ...availability.map((a) => ({
      id: `avail-${a.id}`,
      title: a.status === "beschikbaar" ? "✓" : "✕",
      start: a.date,
      allDay: true,
      display: "background",
      editable: false,
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
      editable={!!isAdmin}
      eventStartEditable={!!isAdmin}
      dateClick={
        onDateClick ? (info) => onDateClick(info.dateStr) : undefined
      }
      eventClick={(info) => {
        if (info.event.id.startsWith("avail-")) return;
        router.push(`/events/${info.event.id}`);
      }}
      eventDrop={(info) => {
        if (info.event.id.startsWith("avail-")) {
          info.revert();
          return;
        }
        const newDate = info.event.startStr.slice(0, 10);
        rescheduleEvent(info.event.id, newDate).catch(() => info.revert());
      }}
    />
  );
}
