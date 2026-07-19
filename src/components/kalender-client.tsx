"use client";

import { useState } from "react";
import { CalendarView } from "@/components/calendar-view";
import { AvailabilityForm } from "@/components/availability-form";
import { NewEventForm } from "@/components/new-event-form";
import type { EventRow, AvailabilityRow } from "@/lib/types";

export function KalenderClient({
  events,
  availability,
  isAdmin,
}: {
  events: EventRow[];
  availability: AvailabilityRow[];
  isAdmin: boolean;
}) {
  const [newEventDate, setNewEventDate] = useState<string | undefined>();

  return (
    <div className="flex flex-col gap-6">
      {isAdmin ? (
        <NewEventForm key={newEventDate} defaultDate={newEventDate} />
      ) : (
        <AvailabilityForm />
      )}

      <CalendarView
        events={events}
        availability={availability}
        onDateClick={isAdmin ? setNewEventDate : undefined}
      />
    </div>
  );
}
