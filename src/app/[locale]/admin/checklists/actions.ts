"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") throw new Error("Admin only");
}

export async function createTemplate(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!code) return;

  const supabase = await createClient();
  const { error } = await supabase.from("checklist_templates").insert({ code });
  if (error) throw error;

  revalidatePath("/admin/checklists");
}

export async function addTemplateItem(
  templateId: string,
  formData: FormData,
) {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  const section = String(formData.get("section") ?? "").trim() || null;

  const supabase = await createClient();
  const { count } = await supabase
    .from("checklist_template_items")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);

  const { error } = await supabase.from("checklist_template_items").insert({
    template_id: templateId,
    section,
    label,
    sort_order: (count ?? 0) + 1,
  });
  if (error) throw error;

  revalidatePath("/admin/checklists");
}

export async function updateTemplateItem(itemId: string, formData: FormData) {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  const section = String(formData.get("section") ?? "").trim() || null;
  const extra = String(formData.get("extra") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_template_items")
    .update({ label, section, extra })
    .eq("id", itemId);
  if (error) throw error;

  revalidatePath("/admin/checklists");
}

export async function setTemplateItemActive(itemId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_template_items")
    .update({ active })
    .eq("id", itemId);
  if (error) throw error;

  revalidatePath("/admin/checklists");
}

export async function deleteTemplate(templateId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_templates")
    .delete()
    .eq("id", templateId);
  if (error) throw error;

  revalidatePath("/admin/checklists");
}
