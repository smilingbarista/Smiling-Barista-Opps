"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export async function toggleItem(
  eventId: string,
  itemId: string,
  checked: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_checklist_items")
    .update({ checked })
    .eq("id", itemId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}/checklists`);
}

export async function submitChecklist(eventId: string, checklistId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_checklists")
    .update({
      status: "ingediend",
      submitted_by: profile.id,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", checklistId);
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/checklists/${checklistId}`);
}
