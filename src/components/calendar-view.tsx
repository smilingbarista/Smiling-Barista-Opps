"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import nlLocale from "@fullcalendar/core/locales/nl";
import { useRouter } from "@/i18n/navigation";
import { rescheduleEvent } from "@/app/[locale]/kalender/actions";
import {
  eventTitleWithTime,
  eventColor,
  PENDING_EVENT_BORDER_COLOR,
} from "@/lib/event-display";
import type { WorkshopSession } from "@/lib/wix";
import type { EventDateRow, EventRow, AvailabilityRow } from "@/lib/types";

// Korte code voor de kalenderweergave; volledige naam blijft in de tooltip.
function shortWorkshopTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("latte art")) return "LA Workshop";
  if (t.includes("barista")) return "BB Workshop";
  if (t.includes("slow brew")) return "SB Workshop";
  if (t.includes("cocktail")) return "CC Workshop";
  return title;
}

export function CalendarView({
  events,
  availability,
  workshops = [],
  onDateClick,
  isAdmin,
}: {
  events: (EventRow & { event_dates?: EventDateRow[] })[];
  availability: AvailabilityRow[];
  workshops?: WorkshopSession[];
  onDateClick?: (date: string) => void;
  isAdmin?: boolean;
}) {
  const router = useRouter();

  const eventSources = [
    ...events.flatMap((e) => {
      const dates = e.event_dates?.length
        ? e.event_dates
        : [{ id: e.id, event_id: e.id, event_date: e.event_date, service_start: e.service_start, service_end: e.service_end }];
      return dates.map((date) => {
        const calendarEvent = {
          ...e,
          event_date: date.event_date,
          service_start: date.service_start,
          service_end: date.service_end,
        };
        return {
          id: date.id,
          title: `${e.pending ? "?? " : ""}${eventTitleWithTime(calendarEvent)}`,
          start: date.event_date,
          allDay: true,
          color: e.pending ? PENDING_EVENT_BORDER_COLOR : eventColor(e.title),
          borderColor: e.pending ? PENDING_EVENT_BORDER_COLOR : undefined,
          classNames: e.pending ? ["pending-event"] : [],
          editable: !!isAdmin,
          extendedProps: {
            address: e.address,
            pending: e.pending,
            eventId: e.id,
            occurrenceId: date.id === e.id ? undefined : date.id,
          },
        };
      });
    }),
    ...workshops.map((w) => {
      const tooltip = [
        w.title,
        w.startTime && w.endTime ? `${w.startTime}–${w.endTime}` : w.startTime,
        w.openSpots != null
          ? w.openSpots > 0
            ? `${w.openSpots} plaatsen vrij`
            : "volzet"
          : null,
        w.locationName,
        w.instructors.join(", ") || null,
      ]
        .filter(Boolean)
        .join("\n");
      return {
        id: `ws-${w.id}`,
        title: shortWorkshopTitle(w.title),
        start: w.startUtc,
        end: w.endUtc ?? undefined,
        allDay: false,
        display: "list-item",
        color: "#0366c5",
        editable: false,
        classNames: ["ws-event"],
        extendedProps: { bookingUrl: w.bookingUrl, tooltip },
      };
    }),
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
      displayEventEnd={true}
      eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
      dateClick={
        onDateClick ? (info) => onDateClick(info.dateStr) : undefined
      }
      eventDidMount={(info) => {
        if (info.event.id.startsWith("avail-")) return;
        if (info.event.id.startsWith("ws-")) {
          info.el.title = info.event.extendedProps.tooltip as string;
          return;
        }
        if (info.event.extendedProps.pending) {
          info.el.classList.add("pending-event");
        }
        const address = info.event.extendedProps.address as string | null;
        info.el.title = address
          ? `${info.event.title}\n${address}`
          : info.event.title;
      }}
      eventClick={(info) => {
        if (info.event.id.startsWith("avail-")) return;
        if (info.event.id.startsWith("ws-")) {
          info.jsEvent.preventDefault();
          const url = info.event.extendedProps.bookingUrl as string;
          if (url) window.open(url, "_blank", "noopener");
          return;
        }
        const eventId = info.event.extendedProps.eventId as string | undefined;
        router.push(`/events/${eventId ?? info.event.id}`);
      }}
      eventDrop={(info) => {
        if (
          info.event.id.startsWith("avail-") ||
          info.event.id.startsWith("ws-")
        ) {
          info.revert();
          return;
        }
        const newDate = info.event.startStr.slice(0, 10);
        const eventId = info.event.extendedProps.eventId as string | undefined;
        const occurrenceId = info.event.extendedProps.occurrenceId as string | undefined;
        rescheduleEvent(eventId ?? info.event.id, newDate, occurrenceId).catch(() =>
          info.revert(),
        );
      }}
    />
  );
}
