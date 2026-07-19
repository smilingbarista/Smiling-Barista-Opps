import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { InventoryItemRowView } from "@/components/inventory-item-row";
import { NewInventoryItemForm } from "@/components/new-inventory-item-form";
import type { InventoryItemRow } from "@/lib/types";

export default async function VoorraadPage() {
  const t = await getTranslations("inventory");
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("inventory_items")
    .select("*")
    .order("category", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t("title")}</h1>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/20 text-xs uppercase text-black/50">
            <th className="py-2 pr-4 font-medium">{t("name")}</th>
            <th className="py-2 pr-4 font-medium">{t("category")}</th>
            <th className="py-2 pr-4 font-medium">{t("quantity")}</th>
            <th className="py-2 pr-4 font-medium">{t("unit")}</th>
          </tr>
        </thead>
        <tbody>
          {((items ?? []) as InventoryItemRow[]).map((item) => (
            <InventoryItemRowView key={item.id} item={item} isAdmin={isAdmin} />
          ))}
        </tbody>
      </table>

      {(!items || items.length === 0) && (
        <p className="text-sm text-black/50">{t("noItems")}</p>
      )}

      {isAdmin && <NewInventoryItemForm />}
    </div>
  );
}
