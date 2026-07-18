import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const requester = await getCurrentProfile();
  if (requester?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { profileId } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: availability }, { data: checklists }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("availability").select("*").eq("profile_id", profileId),
      supabase
        .from("event_checklists")
        .select("id, event_id, template_id, status, submitted_at")
        .eq("submitted_by", profileId),
    ]);

  const exportData = { profile, availability, submittedChecklists: checklists };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="veloprep-data-${profileId}.json"`,
    },
  });
}
