"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") throw new Error("Admin only");
}

export async function inviteTeamMember(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!email) return;

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: fullName ? { full_name: fullName } : undefined,
    redirectTo: `${getSiteUrl()}/nl/auth/set-password`,
  });
  if (error) throw error;

  revalidatePath("/admin/team");
}

export async function updateRole(profileId: string, formData: FormData) {
  await requireAdmin();
  const role = String(formData.get("role") ?? "");
  if (role !== "admin" && role !== "medewerker") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);
  if (error) throw error;

  revalidatePath("/admin/team");
}

export async function deleteProfile(profileId: string) {
  await requireAdmin();
  // Deleting the auth user cascades to profiles -> availability,
  // event_assignments, and anonymizes event_checklists.submitted_by.
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(profileId);
  if (error) throw error;

  revalidatePath("/admin/team");
}
