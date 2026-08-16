"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { veloprepChecklistName } from "@/lib/checklist-label";

const EVENT_FIELDS = [
  "departure_time",
  "transport_duration",
  "arrival_time",
  "service_start",
  "service_end",
  "departure_end_time",
  "end_time",
  "address",
  "description",
  "guest_count",
  "contact_name",
  "contact_phone",
  "setup",
  "menu",
  "pastry",
  "breakfast",
  "personalization_items",
  "personalization_extra",
  "logistics_flow",
] as const;

export async function updateEvent(eventId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can edit events");
  }

  const supabase = await createClient();
  const updates: Record<string, string | null> = {};
  for (const field of EVENT_FIELDS) {
    const value = formData.get(field);
    updates[field] = value === null ? null : String(value) || null;
  }
  updates.updated_at = new Date().toISOString();
  updates.updated_by = profile.id;

  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
}

// Aparte, kleine update voor datum + "Event bevestigd?" — los van
// updateEvent() zodat elk formulier enkel de velden overschrijft die het
// zelf toont (dezelfde reden als updateBaristaNote hieronder).
export async function updateEventMeta(eventId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can edit events");
  }

  const eventDate = String(formData.get("event_date") ?? "");
  const confirmed = formData.get("confirmed") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      event_date: eventDate || null,
      pending: !confirmed,
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", eventId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/kalender");
  revalidatePath("/dashboard");
}

// Aparte, kleine update voor de barista('s) zonder account — los van
// updateEvent() zodat dit niet meer verstrengeld raakt met de rest van het
// formulier (dat was precies de bron van de vorige bug: een verouderd
// formulierveld dat een elders opgeslagen wijziging overschreef).
export async function updateBaristaNote(eventId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can edit events");
  }

  const baristaNames = formData
    .getAll("barista")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const baristaConfirmed = formData.get("barista_confirmed") === "on";
  // Kan niet allebei tegelijk waar zijn: eens bevestigd, is "ook
  // aangevraagd voor een andere opdracht" niet meer van toepassing — hier
  // serverseitig afgedwongen, niet enkel als UI-gedrag.
  const tentativeOtherJob =
    !baristaConfirmed && formData.get("barista_tentative_other_job") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      barista_names: baristaNames,
      barista_confirmed: baristaConfirmed,
      barista_tentative_other_job: tentativeOtherJob,
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", eventId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
  // Komt ook in de kalender- en dashboard-titel terecht (via
  // formatBaristaSuffix), dus die moeten mee vernieuwen.
  revalidatePath("/kalender");
  revalidatePath("/dashboard");
}

// Aparte, kleinere update dan updateEvent() zodat klikken op de titel
// bovenaan de eventpagina enkel het beschrijvende deel wijzigt, zonder de
// rest van het formulier (dat de overige velden zou overschrijven). Bewerkt
// enkel de kale basistitel — barista-naam/status zitten sinds de migratie
// naar echte kolommen (zie updateEvent) niet meer in `title`.
export async function updateEventTitle(eventId: string, newBase: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can edit events");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      title: newBase.trim(),
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", eventId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/kalender");
  revalidatePath("/dashboard");
}

export async function assignProfile(eventId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can assign staff");
  }
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_assignments")
    .insert({ event_id: eventId, profile_id: profileId });
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
}

export async function unassignProfile(eventId: string, profileId: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can unassign staff");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_assignments")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", profileId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
}

export async function attachChecklist(eventId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const templateId = String(formData.get("template_id") ?? "");
  if (!templateId) return;

  const supabase = await createClient();

  const [{ data: template }, { data: event }] = await Promise.all([
    supabase.from("checklist_templates").select("code").eq("id", templateId).single(),
    supabase.from("events").select("title, event_date").eq("id", eventId).single(),
  ]);

  const name =
    template?.code === "veloprep_uitrusting" && event
      ? veloprepChecklistName(event.title, event.event_date)
      : null;

  // Items worden niet gekopieerd: de checklist toont voortaan live de
  // actuele actieve items van de template.
  const { error: insertError } = await supabase
    .from("event_checklists")
    .insert({ event_id: eventId, template_id: templateId, name });
  if (insertError) throw insertError;

  revalidatePath(`/events/${eventId}`);
}

// Geeft de fout terug i.p.v. te throwen: Next.js verbergt in productie de
// tekst van elke error die een Server Action throwt (bv. "bestand te groot"
// of "bestandstype niet ondersteund" zouden anders onleesbaar worden).
export async function uploadEventImage(
  eventId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    return { error: "Only admins can add images" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return {};

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${eventId}/${crypto.randomUUID()}.${ext}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("event-images")
    .upload(path, bytes, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase
    .from("event_images")
    .insert({ event_id: eventId, path });
  if (insertError) return { error: insertError.message };

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/briefing`);
  return {};
}

export async function deleteEventImage(
  eventId: string,
  imageId: string,
  path: string,
) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can remove images");
  }

  const supabase = await createClient();
  await supabase.storage.from("event-images").remove([path]);
  const { error } = await supabase
    .from("event_images")
    .delete()
    .eq("id", imageId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/briefing`);
}

export async function saveUsageReport(eventId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const toNumberOrNull = (value: FormDataEntryValue | null) => {
    const str = String(value ?? "").trim();
    if (!str) return null;
    const n = Number(str.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const supabase = await createClient();
  const { error } = await supabase.from("event_usage_reports").upsert({
    event_id: eventId,
    coffee_kg: toNumberOrNull(formData.get("coffee_kg")),
    coffee_hoppers: toNumberOrNull(formData.get("coffee_hoppers")),
    milk_liters: toNumberOrNull(formData.get("milk_liters")),
    popular_non_coffee_drinks:
      String(formData.get("popular_non_coffee_drinks") ?? "").trim() || null,
    submitted_by: profile.id,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
}

export async function archiveEvent(eventId: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can archive events");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      status: "gearchiveerd",
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", eventId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/kalender");
  revalidatePath("/dashboard");
}

export async function deleteEvent(eventId: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can delete events");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;

  revalidatePath("/kalender");
  revalidatePath("/dashboard");
  redirect("/kalender");
}
