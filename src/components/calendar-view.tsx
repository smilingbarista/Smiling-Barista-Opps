"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import nlLocale from "@fullcalendar/core/locales/nl";
import { useRouter } from "@/i18n/navigation";
import { rescheduleEvent } from "@/app/[locale]/kalender/actions";
import { eventTitleWithTime } from "@/lib/event-display";
import type { EventRow, AvailabilityRow } from "@/lib/types";

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
      title: eventTitleWithTime(e),
      start: e.event_date,
      allDay: true,
      color: "#0366c5",
      editable: !!isAdmin,
      extendedProps: { address: e.address },
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
      locales={[nlLocale]}
      firstDay={1}
      events={eventSources}
      editable={!!isAdmin}
      eventStartEditable={!!isAdmin}
      dateClick={
        onDateClick ? (info) => onDateClick(info.dateStr) : undefined
      }
      eventDidMount={(info) => {
        if (info.event.id.startsWith("avail-")) return;
        const address = info.event.extendedProps.address as string | null;
        info.el.title = address
          ? `${info.event.title}\n${address}`
          : info.event.title;
      }}
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
