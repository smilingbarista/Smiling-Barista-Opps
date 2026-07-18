"use client";

import { useTranslations } from "next-intl";
import { updateEvent } from "@/app/[locale]/events/[id]/actions";
import type { EventRow } from "@/lib/types";

function Field({
  label,
  name,
  defaultValue,
  readOnly,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  readOnly: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        readOnly={readOnly}
        className={`rounded border px-2 py-1 ${
          readOnly ? "border-transparent bg-black/5" : "border-black/20"
        }`}
      />
    </label>
  );
}

export function EventDetailsForm({
  event,
  readOnly,
}: {
  event: EventRow;
  readOnly: boolean;
}) {
  const t = useTranslations("event");
  const common = useTranslations("common");

  return (
    <form
      action={(formData) => updateEvent(event.id, formData)}
      className="flex flex-col gap-6"
    >
      <Field label={t("date")} name="event_date" type="date" defaultValue={event.event_date} readOnly={readOnly} />

      <fieldset className="flex flex-col gap-3">
        <legend className="font-medium">{t("timingSection")}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={t("departureTime")} name="departure_time" type="time" defaultValue={event.departure_time} readOnly={readOnly} />
          <Field label={t("transportDuration")} name="transport_duration" defaultValue={event.transport_duration} readOnly={readOnly} />
          <Field label={t("arrival")} name="arrival_time" type="time" defaultValue={event.arrival_time} readOnly={readOnly} />
          <Field label={t("serviceStart")} name="service_start" type="time" defaultValue={event.service_start} readOnly={readOnly} />
          <Field label={t("serviceEnd")} name="service_end" type="time" defaultValue={event.service_end} readOnly={readOnly} />
          <Field label={t("departureEnd")} name="departure_end_time" type="time" defaultValue={event.departure_end_time} readOnly={readOnly} />
          <Field label={t("endTime")} name="end_time" type="time" defaultValue={event.end_time} readOnly={readOnly} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-medium">{t("eventSection")}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("description")} name="title" defaultValue={event.title} readOnly={readOnly} />
          <Field label={t("address")} name="address" defaultValue={event.address} readOnly={readOnly} />
          <Field label={t("descriptionDetails")} name="description" defaultValue={event.description} readOnly={readOnly} />
          <Field label={t("guestCount")} name="guest_count" defaultValue={event.guest_count} readOnly={readOnly} />
          <Field label={t("contactPerson")} name="contact_name" defaultValue={event.contact_name} readOnly={readOnly} />
          <Field label={t("contactPhone")} name="contact_phone" defaultValue={event.contact_phone} readOnly={readOnly} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-medium">{t("offerSection")}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("setup")} name="setup" defaultValue={event.setup} readOnly={readOnly} />
          <Field label={t("menu")} name="menu" defaultValue={event.menu} readOnly={readOnly} />
          <Field label={t("pastry")} name="pastry" defaultValue={event.pastry} readOnly={readOnly} />
          <Field label={t("breakfast")} name="breakfast" defaultValue={event.breakfast} readOnly={readOnly} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-medium">{t("personalizationSection")}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("personalizationItems")} name="personalization_items" defaultValue={event.personalization_items} readOnly={readOnly} />
          <Field label={t("extra")} name="personalization_extra" defaultValue={event.personalization_extra} readOnly={readOnly} />
        </div>
        <Field label={t("logisticsFlow")} name="logistics_flow" defaultValue={event.logistics_flow} readOnly={readOnly} />
      </fieldset>

      {!readOnly && (
        <button
          type="submit"
          className="self-start rounded bg-brand px-4 py-2 text-brand-foreground"
        >
          {common("save")}
        </button>
      )}
    </form>
  );
}
