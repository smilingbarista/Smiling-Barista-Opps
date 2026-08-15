"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { generateAndStoreBackup } from "@/lib/backup-generate";

export async function createBackupNow() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Admin only");
  }

  const supabase = await createClient();
  await generateAndStoreBackup(supabase, "manual");

  revalidatePath("/admin/backup");
}
