"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") throw new Error("Admin only");
}

export async function createInventoryItem(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const category = String(formData.get("category") ?? "").trim() || null;
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const quantity = Number(formData.get("quantity") ?? 0) || 0;

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .insert({ name, category, unit, quantity });
  if (error) throw error;

  revalidatePath("/voorraad");
}

export async function updateInventoryItem(itemId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const category = String(formData.get("category") ?? "").trim() || null;
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const quantity = Number(formData.get("quantity") ?? 0) || 0;

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .update({ name, category, unit, quantity })
    .eq("id", itemId);
  if (error) throw error;

  revalidatePath("/voorraad");
}

export async function deleteInventoryItem(itemId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", itemId);
  if (error) throw error;

  revalidatePath("/voorraad");
}
