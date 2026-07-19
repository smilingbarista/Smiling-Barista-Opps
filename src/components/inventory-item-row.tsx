"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  updateInventoryItem,
  deleteInventoryItem,
} from "@/app/[locale]/voorraad/actions";
import type { InventoryItemRow } from "@/lib/types";

export function InventoryItemRowView({
  item,
  isAdmin,
}: {
  item: InventoryItemRow;
  isAdmin: boolean;
}) {
  const common = useTranslations("common");
  const inventory = useTranslations("inventory");
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-b border-black/10">
        <td colSpan={5} className="py-2">
          <form
            action={async (formData) => {
              await updateInventoryItem(item.id, formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <input
              name="name"
              defaultValue={item.name}
              required
              placeholder={inventory("name")}
              className="rounded border border-black/20 px-2 py-1 text-sm"
            />
            <input
              name="category"
              defaultValue={item.category ?? ""}
              placeholder={inventory("category")}
              className="rounded border border-black/20 px-2 py-1 text-sm"
            />
            <input
              name="quantity"
              type="number"
              step="any"
              defaultValue={item.quantity}
              placeholder={inventory("quantity")}
              className="w-24 rounded border border-black/20 px-2 py-1 text-sm"
            />
            <input
              name="unit"
              defaultValue={item.unit ?? ""}
              placeholder={inventory("unit")}
              className="w-24 rounded border border-black/20 px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-brand px-3 py-1 text-sm text-brand-foreground"
            >
              {common("save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border border-black/20 px-3 py-1 text-sm"
            >
              {common("cancel")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`${common("delete")}: "${item.name}"?`)) {
                  deleteInventoryItem(item.id);
                }
              }}
              className="ml-auto rounded border border-red-600 px-3 py-1 text-sm text-red-600"
            >
              {common("delete")}
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`border-b border-black/10 text-sm ${isAdmin ? "cursor-pointer hover:bg-black/5" : ""}`}
      onClick={() => isAdmin && setEditing(true)}
    >
      <td className="py-2 pr-4">{item.name}</td>
      <td className="py-2 pr-4 text-black/60">{item.category || "—"}</td>
      <td className="py-2 pr-4">{item.quantity}</td>
      <td className="py-2 pr-4 text-black/60">{item.unit || "—"}</td>
    </tr>
  );
}
