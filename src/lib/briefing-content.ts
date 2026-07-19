import type { EventRow } from "@/lib/types";

export type BriefingSection = {
  heading: string | null;
  rows: { label: string; value: string }[];
};

export function buildBriefingSections(
  event: EventRow,
  t: (key: string) => string,
): BriefingSection[] {
  const v = (value: string | null) => value || "—";

  return [
    {
      heading: null,
      rows: [{ label: t("date"), value: v(event.event_date) }],
    },
    {
      heading: t("timingSection"),
      rows: [
        { label: t("departureTime"), value: v(event.departure_time) },
        { label: t("transportDuration"), value: v(event.transport_duration) },
        { label: t("arrival"), value: v(event.arrival_time) },
        { label: t("serviceStart"), value: v(event.service_start) },
        { label: t("serviceEnd"), value: v(event.service_end) },
        { label: t("departureEnd"), value: v(event.departure_end_time) },
        { label: t("endTime"), value: v(event.end_time) },
      ],
    },
    {
      heading: t("eventSection"),
      rows: [
        { label: t("address"), value: v(event.address) },
        { label: t("descriptionDetails"), value: v(event.description) },
        { label: t("guestCount"), value: v(event.guest_count) },
        { label: t("contactPerson"), value: v(event.contact_name) },
        { label: t("contactPhone"), value: v(event.contact_phone) },
      ],
    },
    {
      heading: t("offerSection"),
      rows: [
        { label: t("setup"), value: v(event.setup) },
        { label: t("menu"), value: v(event.menu) },
        { label: t("pastry"), value: v(event.pastry) },
        { label: t("breakfast"), value: v(event.breakfast) },
      ],
    },
    {
      heading: t("personalizationSection"),
      rows: [
        { label: t("personalizationItems"), value: v(event.personalization_items) },
        { label: t("extra"), value: v(event.personalization_extra) },
      ],
    },
    {
      heading: t("logisticsFlow"),
      rows: [{ label: t("logisticsFlow"), value: v(event.logistics_flow) }],
    },
  ];
}

export function buildBriefingText(
  title: string,
  briefingLabel: string,
  sections: BriefingSection[],
): string {
  const lines: string[] = [`*${briefingLabel}: ${title}*`, ""];

  for (const section of sections) {
    if (section.heading) {
      lines.push(`*${section.heading}*`);
    }
    for (const row of section.rows) {
      if (section.heading === row.label && section.rows.length === 1) {
        lines.push(row.value);
      } else {
        lines.push(`${row.label}: ${row.value}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
