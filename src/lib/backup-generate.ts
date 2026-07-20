import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventRow } from "@/lib/types";

export async function generateAndStoreBackup(
  supabase: SupabaseClient,
  triggeredBy: "cron" | "manual",
): Promise<string> {
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const { buildBackupPdf } = await import("@/lib/backup-pdf");
  const doc = buildBackupPdf((events ?? []) as EventRow[]);
  const bytes = doc.output("arraybuffer");

  const stamp = new Date().toISOString().slice(0, 10);
  const path = `veloprep-backup-${stamp}-${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("backups")
    .upload(path, Buffer.from(bytes), {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase
    .from("backups")
    .insert({ path, triggered_by: triggeredBy });
  if (insertError) throw insertError;

  return path;
}
