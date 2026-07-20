"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { veloprepChecklistName } from "@/lib/checklist-label";
import { buildEventTitle } from "@/lib/event-title";

export async function createEvent(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can create events");
  }

  const supabase = await createClient();
  const rawTitle = String(formData.get("title") ?? "");
  const eventDate = String(formData.get("event_date") ?? "");
  const barista = String(formData.get("barista") ?? "").trim();
  const confirmed = formData.get("confirmed") === "on";
  if (!rawTitle || !eventDate) {
    throw new Error("Titel en datum zijn verplicht");
  }

  const title = buildEventTitle(rawTitle, [barista], !confirmed);

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      event_date: eventDate,
      address: String(formData.get("address") ?? "") || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) throw error;

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

export async function rescheduleEvent(eventId: string, newDate: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can reschedule events");
  }

  const supabase = await createClient();
  const { error } = await supabase
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
