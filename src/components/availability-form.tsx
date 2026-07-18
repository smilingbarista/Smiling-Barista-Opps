"use client";

import { useTranslations } from "next-intl";
import { setAvailability } from "@/app/[locale]/kalender/actions";

export function AvailabilityForm() {
  const t = useTranslations("calendar");

  return (
    <form action={setAvailability} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        {t("availability")}
        <input
          type="date"
          name="date"
          required
          className="rounded border border-black/20 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("note")}
        <input
          type="text"
          name="note"
          className="rounded border border-black/20 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        name="status"
        value="beschikbaar"
        className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
      >
        {t("available")}
      </button>
      <button
        type="submit"
        name="status"
        value="niet_beschikbaar"
        className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
      >
        {t("unavailable")}
      </button>
    </form>
  );
}
