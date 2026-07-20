"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("calendar");
  const [newEventDate, setNewEventDate] = useState<string | undefined>();

  async function handleBackup() {
    const { buildBackupPdf } = await import("@/lib/backup-pdf");
    const doc = buildBackupPdf(events);
    doc.save(`veloprep-backup-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="flex flex-col gap-6">
      {isAdmin ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <NewEventForm key={newEventDate} defaultDate={newEventDate} />
          <button
            type="button"
            onClick={handleBackup}
            className="no-print rounded border border-black/20 px-3 py-1.5 text-sm"
          >
            {t("downloadBackup")}
          </button>
        </div>
      ) : (
        <AvailabilityForm />
      )}

      <CalendarView
        events={events}
        availability={availability}
        onDateClick={isAdmin ? setNewEventDate : undefined}
        isAdmin={isAdmin}
      />
    </div>
  );
}
