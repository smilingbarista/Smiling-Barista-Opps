"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export type ChecklistItemSave = {
  templateItemId: string;
  checked: boolean;
  note: string;
};

export async function saveChecklistItems(
  eventId: string,
  checklistId: string,
  items: ChecklistItemSave[],
) {
  if (items.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("event_checklist_items").upsert(
    items.map((item) => ({
      event_checklist_id: checklistId,
      template_item_id: item.templateItemId,
      checked: item.checked,
      note: item.note || null,
    })),
    { onConflict: "event_checklist_id,template_item_id" },
  );
  if (error) throw error;

  revalidatePath(`/events/${eventId}/checklists/${checklistId}`);
}

export async function submitChecklist(
  eventId: string,
  checklistId: string,
  items: ChecklistItemSave[],
) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  await saveChecklistItems(eventId, checklistId, items);

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
