"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createEvent } from "@/app/[locale]/kalender/actions";

export function NewEventForm({ defaultDate }: { defaultDate?: string }) {
  const t = useTranslations("calendar");
  const event = useTranslations("event");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const id = await createEvent(formData);
    router.push(`/events/${id}`);
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        {event("description")}
        <input
          type="text"
          name="title"
          required
          className="rounded border border-black/20 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {event("date")}
        <input
          type="date"
          name="event_date"
          required
          defaultValue={defaultDate}
          className="rounded border border-black/20 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {event("address")}
        <input
          type="text"
          name="address"
          className="rounded border border-black/20 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {event("guestCount")}
        <input
          type="text"
          name="guest_count"
          className="rounded border border-black/20 px-2 py-1"
        />
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
