"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markBriefingPrinted(eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_briefing_printed", {
    p_event_id: eventId,
  });
  if (error) throw error;

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/briefing`);
  revalidatePath("/dashboard");
}
