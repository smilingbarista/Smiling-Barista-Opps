"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { generateAndStoreBackup } from "@/lib/backup-generate";
import { parseEventTitle } from "@/lib/event-title";

export async function createBackupNow() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Admin only");
  }

  const supabase = await createClient();
  await generateAndStoreBackup(supabase, "manual");

  revalidatePath("/admin/backup");
}

// Eenmalige migratie: de barista-naam/-status die tot nu toe in `title`
// zelf zaten (bv. "Titel (Naam?)") verhuizen naar de nieuwe kolommen
// barista_names/barista_confirmed/pending, en `title` wordt opgekuist tot
// enkel de kale basis. Kan na een succesvolle run + controle verwijderd
// worden, samen met parseEventTitle in src/lib/event-title.ts.
export async function backfillBaristaStatus(): Promise<{ count: number }> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Admin only");
  }

  const supabase = await createClient();
  const { data: events, error: fetchError } = await supabase
    .from("events")
    .select("id, title");
  if (fetchError) throw fetchError;

  let count = 0;
  for (const event of events ?? []) {
    const parsed = parseEventTitle(event.title);
    const { error } = await supabase
      .from("events")
      .update({
        title: parsed.base,
        barista_names: parsed.baristas,
        barista_confirmed: parsed.baristaConfirmed,
        pending: parsed.pending,
      })
      .eq("id", event.id);
    if (error) throw error;
    count++;
  }

  revalidatePath("/kalender");
  revalidatePath("/dashboard");
  revalidatePath("/admin/backup");
  return { count };
}
