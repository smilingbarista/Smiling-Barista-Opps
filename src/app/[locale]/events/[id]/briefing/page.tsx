import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/print-button";
import { EventImages } from "@/components/event-images";
import type { EventRow, EventImageRow } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("title")
    .eq("id", id)
    .single();

  return { title: data?.title ?? "Briefing" };
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <tr className="border-b border-black/10">
      <th className="w-48 py-2 pr-4 text-left font-semibold align-top">
        {label}
      </th>
      <td className="py-2 align-top">{value || "—"}</td>
    </tr>
  );
}

export default async function EventBriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("event");
  const supabase = await createClient();

  const { data } = await supabase.from("events").select("*").eq("id", id).single();
  if (!data) notFound();
  const event = data as EventRow;

  const { data: images } = await supabase
    .from("event_images")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 print:max-w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {t("briefingTitle")}: {event.title}
        </h1>
        <PrintButton />
      </div>

      <EventImages
        eventId={id}
        images={(images ?? []) as EventImageRow[]}
        readOnly
      />

      <table className="w-full border-collapse text-sm">
        <tbody>
          <Row label={t("date")} value={event.event_date} />
        </tbody>
      </table>

      <div>
        <h2 className="mb-1 bg-brand/10 px-2 py-1 font-medium">
          {t("timingSection")}
        </h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <Row label={t("departureTime")} value={event.departure_time} />
            <Row label={t("transportDuration")} value={event.transport_duration} />
            <Row label={t("arrival")} value={event.arrival_time} />
            <Row label={t("serviceStart")} value={event.service_start} />
            <Row label={t("serviceEnd")} value={event.service_end} />
            <Row label={t("departureEnd")} value={event.departure_end_time} />
            <Row label={t("endTime")} value={event.end_time} />
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-1 bg-brand/10 px-2 py-1 font-medium">
          {t("eventSection")}
        </h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <Row label={t("address")} value={event.address} />
            <Row label={t("descriptionDetails")} value={event.description} />
            <Row label={t("guestCount")} value={event.guest_count} />
            <Row label={t("contactPerson")} value={event.contact_name} />
            <Row label={t("contactPhone")} value={event.contact_phone} />
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-1 bg-brand/10 px-2 py-1 font-medium">
          {t("offerSection")}
        </h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <Row label={t("setup")} value={event.setup} />
            <Row label={t("menu")} value={event.menu} />
            <Row label={t("pastry")} value={event.pastry} />
            <Row label={t("breakfast")} value={event.breakfast} />
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-1 bg-brand/10 px-2 py-1 font-medium">
          {t("personalizationSection")}
        </h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <Row label={t("personalizationItems")} value={event.personalization_items} />
            <Row label={t("extra")} value={event.personalization_extra} />
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-1 bg-brand/10 px-2 py-1 font-medium">
          {t("logisticsFlow")}
        </h2>
        <p className="whitespace-pre-wrap text-sm">
          {event.logistics_flow || "—"}
        </p>
      </div>
    </div>
  );
}
