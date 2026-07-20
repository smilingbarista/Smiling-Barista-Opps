"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { veloprepChecklistName } from "@/lib/checklist-label";
import { buildEventTitle } from "@/lib/event-title";

const EVENT_FIELDS = [
  "event_date",
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

  const base = String(formData.get("title") ?? "").trim();
  const baristas = formData.getAll("barista").map((v) => String(v));
  const confirmed = formData.get("confirmed") === "on";
  const baristaConfirmed = formData.get("barista_confirmed") === "on";
  updates.title = buildEventTitle(base, baristas, !confirmed, baristaConfirmed);

  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
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

export async function uploadEventImage(eventId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can add images");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${eventId}/${crypto.randomUUID()}.${ext}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("event-images")
    .upload(path, bytes, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase
    .from("event_images")
    .insert({ event_id: eventId, path });
  if (insertError) throw insertError;

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/briefing`);
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

export async function archiveEvent(eventId: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can archive events");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status: "gearchiveerd" })
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
