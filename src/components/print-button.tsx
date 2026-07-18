"use client";

import { useTranslations } from "next-intl";

export function PrintButton() {
  const t = useTranslations("event");
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded bg-brand px-4 py-2 text-brand-foreground"
    >
      {t("print")}
    </button>
  );
}
