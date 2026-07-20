"use client";

import { useTranslations } from "next-intl";
import { markBriefingPrinted } from "@/app/[locale]/events/[id]/briefing/actions";

export function PrintButton({ eventId }: { eventId: string }) {
  const t = useTranslations("event");
  return (
    <button
      onClick={async () => {
        await markBriefingPrinted(eventId);
        window.print();
      }}
      className="no-print rounded bg-brand px-4 py-2 text-brand-foreground"
    >
      {t("print")}
    </button>
  );
}
