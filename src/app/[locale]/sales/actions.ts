"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveCustomerContact(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Only admins can save customer contacts");
  }

  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const threadId = String(formData.get("thread_id") ?? "").trim();

  if (!name || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A name and valid email address are required");
  }
  if (company.length > 200 || phone.length > 80 || threadId.length > 200) {
    throw new Error("Contact details are too long");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customer_contacts").upsert(
    {
      name,
      company: company || null,
      email,
      phone: phone || null,
      source_thread_id: threadId || null,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (error) throw error;

  const locale = await getLocale();
  revalidatePath(`/${locale}/sales`);
  revalidatePath(`/${locale}/sales/contacts`);
  redirect(`/${locale}/sales/contacts?saved=1`);
}