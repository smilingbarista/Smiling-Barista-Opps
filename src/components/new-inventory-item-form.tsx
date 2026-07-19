"use client";

import { useTranslations } from "next-intl";
import { createInventoryItem } from "@/app/[locale]/voorraad/actions";

export function NewInventoryItemForm() {
  const inventory = useTranslations("inventory");

  return (
    <form action={createInventoryItem} className="flex flex-wrap items-end gap-2">
      <input
        name="name"
        required
        placeholder={inventory("name")}
        className="rounded border border-black/20 px-2 py-1 text-sm"
      />
      <input
        name="category"
        placeholder={inventory("category")}
        className="rounded border border-black/20 px-2 py-1 text-sm"
      />
      <input
        name="quantity"
        type="number"
        step="any"
        defaultValue={0}
        placeholder={inventory("quantity")}
        className="w-24 rounded border border-black/20 px-2 py-1 text-sm"
      />
      <input
        name="unit"
        placeholder={inventory("unit")}
        className="w-24 rounded border border-black/20 px-2 py-1 text-sm"
      />
      <button
        type="submit"
        className="rounded bg-brand px-3 py-1.5 text-sm text-brand-foreground"
      >
        {inventory("addItem")}
      </button>
    </form>
  );
}
