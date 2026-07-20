import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { path } = await params;
  const filePath = path.join("/");

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("backups")
    .createSignedUrl(filePath, 60);

  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
