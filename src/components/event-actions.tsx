"use client";

import { useTranslations } from "next-intl";
import { archiveEvent, deleteEvent } from "@/app/[locale]/events/[id]/actions";

export function EventActions({ eventId }: { eventId: string }) {
  const t = useTranslations("event");
  const common = useTranslations("common");

  return (
    <div className="flex gap-2">
      <button
        onClick={() => archiveEvent(eventId)}
        className="rounded border border-black/20 px-3 py-1.5 text-sm hover:bg-black/5"
      >
        {t("archive")}
      </button>
      <button
        onClick={() => {
          if (confirm(t("confirmDelete"))) {
            deleteEvent(eventId);
          }
        }}
        className="rounded border border-red-600 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        {common("delete")}
      </button>
    </div>
  );
}
