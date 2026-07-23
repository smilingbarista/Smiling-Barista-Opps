"use client";

import { useTranslations } from "next-intl";
import { saveUsageReport } from "@/app/[locale]/events/[id]/actions";
import type { EventUsageReportRow } from "@/lib/types";

export function UsageReportForm({
  eventId,
  report,
}: {
  eventId: string;
  report: EventUsageReportRow | null;
}) {
  const t = useTranslations("event");

  return (
    <form
      action={(formData) => saveUsageReport(eventId, formData)}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t("usageCoffeeKg")}
          <input
            type="number"
            step="0.1"
            min="0"
            name="coffee_kg"
            defaultValue={report?.coffee_kg ?? ""}
            className="w-32 rounded border border-black/20 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("usageCoffeeHoppers")}
          <input
            type="number"
            step="0.5"
            min="0"
            name="coffee_hoppers"
            defaultValue={report?.coffee_hoppers ?? ""}
            className="w-32 rounded border border-black/20 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("usageMilkLiters")}
          <input
            type="number"
            step="0.1"
            min="0"
            name="milk_liters"
            defaultValue={report?.milk_liters ?? ""}
            className="w-32 rounded border border-black/20 px-2 py-1"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        {t("usagePopularDrinks")}
        <textarea
          name="popular_non_coffee_drinks"
          rows={2}
          defaultValue={report?.popular_non_coffee_drinks ?? ""}
          className="rounded border border-black/20 px-2 py-1"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="self-start rounded bg-brand px-3 py-1.5 text-sm text-brand-foreground"
        >
          {t("usageSubmit")}
        </button>
        {report?.submitted_at && (
          <span className="text-sm text-black/50">
            {t("usageSubmittedBy", {
              name: report.profiles?.full_name ?? "",
            })}
          </span>
        )}
      </div>
    </form>
  );
}
