"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

const EVENT_FIELDS = [
  "title",
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

  const { data: eventChecklist, error: insertError } = await supabase
    .from("event_checklists")
    .insert({ event_id: eventId, template_id: templateId })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const { data: templateItems, error: itemsError } = await supabase
    .from("checklist_template_items")
    .select("id")
    .eq("template_id", templateId);
  if (itemsError) throw itemsError;

  if (templateItems && templateItems.length > 0) {
    const { error: bulkError } = await supabase
      .from("event_checklist_items")
      .insert(
        templateItems.map((item) => ({
          event_checklist_id: eventChecklist.id,
          template_item_id: item.id,
        })),
      );
    if (bulkError) throw bulkError;
  }

  revalidatePath(`/events/${eventId}`);
}
