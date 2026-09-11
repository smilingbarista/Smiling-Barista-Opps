"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createEvent } from "@/app/[locale]/kalender/actions";

export function NewEventForm({ defaultDate }: { defaultDate?: string }) {
  const t = useTranslations("calendar");
  const event = useTranslations("event");
  const router = useRouter();
  const [dates, setDates] = useState([{ id: 0, date: defaultDate ?? "" }]);

  async function handleSubmit(formData: FormData) {
    const id = await createEvent(formData);
    router.push(`/events/${id}`);
  }

  return (
    <form action={handleSubmit} className="flex w-full flex-wrap items-end gap-3">
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
        {event("description")}
        <input
          type="text"
          name="title"
          required
          className="rounded border border-black/20 px-2 py-1"
        />
      </label>
      <fieldset className="flex basis-full flex-col gap-2">
        <legend className="text-sm font-medium">{event("dates")}</legend>
        {dates.map((row, index) => (
          <div key={row.id} className="flex w-full flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              {event("date")} {index + 1}
              <input
                type="date"
                name="event_date"
                required
                value={row.date}
                onChange={(e) =>
                  setDates((current) =>
                    current.map((item) =>
                      item.id === row.id ? { ...item, date: e.target.value } : item,
                    ),
                  )
                }
                className="rounded border border-black/20 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {event("serviceStart")}
              <input
                type="time"
                name="service_start"
                className="rounded border border-black/20 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {event("serviceEnd")}
              <input
                type="time"
                name="service_end"
                className="rounded border border-black/20 px-2 py-1"
              />
            </label>
            {dates.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setDates((current) => current.filter((item) => item.id !== row.id))
                }
                className="rounded border border-black/20 px-2 py-1 text-sm"
              >
                {event("removeDate")}
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setDates((current) => [
              ...current,
              { id: Date.now(), date: "" },
            ])
          }
          className="w-full rounded border border-brand px-3 py-1.5 text-sm text-brand"
        >
          {event("addDate")}
        </button>
      </fieldset>
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
        {event("location")}
        <input
          type="text"
          name="address"
          className="rounded border border-black/20 px-2 py-1"
        />
      </label>
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
        {event("barista")}
        <input
          type="text"
          name="barista"
          className="rounded border border-black/20 px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input type="checkbox" name="confirmed" defaultChecked />
        {event("confirmed")}
      </label>
      <button
        type="submit"
        className="rounded bg-brand px-3 py-1.5 text-sm text-brand-foreground"
      >
        {t("newEvent")}
      </button>
    </form>
  );
}
