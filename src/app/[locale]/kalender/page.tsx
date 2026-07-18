import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { CalendarView } from "@/components/calendar-view";
import { AvailabilityForm } from "@/components/availability-form";
import { NewEventForm } from "@/components/new-event-form";
import type { EventRow, AvailabilityRow } from "@/lib/types";

export default async function KalenderPage() {
  const t = await getTranslations("calendar");
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const availabilityQuery =
    profile?.role === "admin"
      ? supabase.from("availability").select("*")
      : supabase
          .from("availability")
          .select("*")
          .eq("profile_id", profile?.id ?? "");
  const { data: availability } = await availabilityQuery;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>

      {profile?.role === "admin" ? (
        <NewEventForm />
      ) : (
        <AvailabilityForm />
      )}

      <CalendarView
        events={(events ?? []) as EventRow[]}
        availability={(availability ?? []) as AvailabilityRow[]}
      />
    </div>
  );
}
