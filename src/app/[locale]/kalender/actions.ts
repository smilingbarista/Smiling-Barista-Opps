"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export async function createEvent(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can create events");
  }

  const supabase = await createClient();
  const title = String(formData.get("title") ?? "");
  const eventDate = String(formData.get("event_date") ?? "");
  if (!title || !eventDate) {
    throw new Error("Titel en datum zijn verplicht");
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      event_date: eventDate,
      address: String(formData.get("address") ?? "") || null,
      guest_count: String(formData.get("guest_count") ?? "") || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath("/kalender");
  return data.id as string;
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
