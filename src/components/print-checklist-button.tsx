"use client";

import { useTranslations } from "next-intl";

export function PrintChecklistButton() {
  const t = useTranslations("event");

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded bg-brand px-4 py-2 text-brand-foreground"
    >
      {t("printChecklist")}
    </button>
  );
}