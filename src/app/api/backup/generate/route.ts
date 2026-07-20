import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAndStoreBackup } from "@/lib/backup-generate";

// Wordt dagelijks aangeroepen door Vercel Cron (zie vercel.json).
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const path = await generateAndStoreBackup(supabase, "cron");

  return NextResponse.json({ ok: true, path });
}
