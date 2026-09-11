"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { veloprepChecklistName } from "@/lib/checklist-label";
import { WIX_WORKSHOPS_TAG } from "@/lib/wix";

// Ververst de gecachte workshopdata uit Wix. Wordt aangeroepen door de
// "Workshops nu inlezen"-knop; verder leest de app Wix maar 1x per week.
export async function refreshWorkshops() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  updateTag(WIX_WORKSHOPS_TAG);
}

export async function createEvent(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can create events");
  }

  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const eventDates = formData
    .getAll("event_date")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const serviceStarts = formData.getAll("service_start").map((value) => String(value) || null);
  const serviceEnds = formData.getAll("service_end").map((value) => String(value) || null);
  const eventDate = eventDates[0] ?? "";
  const barista = String(formData.get("barista") ?? "").trim();
  const confirmed = formData.get("confirmed") === "on";
  if (!title || eventDates.length === 0) {
    throw new Error("Titel en datum zijn verplicht");
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      event_date: eventDate,
      service_start: serviceStarts[0],
      service_end: serviceEnds[0],
      address: String(formData.get("address") ?? "") || null,
      barista_names: barista ? [barista] : [],
      pending: !confirmed,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) throw error;

  const { error: datesError } = await supabase.from("event_dates").insert(
    eventDates.map((date, index) => ({
      event_id: data.id,
      event_date: date,
      service_start: serviceStarts[index] ?? null,
      service_end: serviceEnds[index] ?? null,
    })),
  );
  if (datesError) throw datesError;

  const isTeambuilding = title.toLowerCase().includes("teambuilding");
  const autoTemplateCode = isTeambuilding
    ? "teambuilding_latte_art"
    : "veloprep_uitrusting";

  const { data: autoTemplate } = await supabase
    .from("checklist_templates")
    .select("id")
    .eq("code", autoTemplateCode)
    .maybeSingle();

  if (autoTemplate) {
    await supabase.from("event_checklists").insert({
      event_id: data.id,
      template_id: autoTemplate.id,
      name: isTeambuilding ? null : veloprepChecklistName(title, eventDate),
    });
  }

  revalidatePath("/kalender");
  revalidatePath("/dashboard");
  return data.id as string;
}

export async function rescheduleEvent(
  eventId: string,
  newDate: string,
  occurrenceId?: string,
) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can reschedule events");
  }

  const supabase = await createClient();
  const { error } = occurrenceId
    ? await supabase
        .from("event_dates")
        .update({ event_date: newDate })
        .eq("id", occurrenceId)
        .eq("event_id", eventId)
    : await supabase
        .from("events")
        .update({ event_date: newDate })
        .eq("id", eventId);
  if (error) throw error;

  revalidatePath("/kalender");
  revalidatePath(`/events/${eventId}`);
}

export async function setAvailability(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = await createClient();
  const date = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "") || null;

  if (!date || (status !== "beschikbaar" && status !== "niet_beschikbaar")) {
    throw new Error("Ongeldige invoer");
  }

  const { error } = await supabase
    .from("availability")
    .upsert(
      { profile_id: profile.id, date, status, note },
      { onConflict: "profile_id,date" },
    );

  if (error) throw error;

  revalidatePath("/kalender");
}
