"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  updateInventoryItem,
  adjustInventoryQuantity,
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
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-black/10 text-sm">
      <td
        className={`py-2 pr-4 ${isAdmin ? "cursor-pointer hover:text-brand" : ""}`}
        onClick={() => isAdmin && setEditing(true)}
      >
        {item.name}
      </td>
      <td className="py-2 pr-4 text-black/60">{item.category || "—"}</td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              disabled={item.quantity <= 0}
              onClick={() => adjustInventoryQuantity(item.id, -1)}
              aria-label={inventory("decrease")}
              className="flex h-6 w-6 items-center justify-center rounded border border-black/20 disabled:opacity-30"
            >
              −
            </button>
          )}
          <span>{item.quantity}</span>
        </div>
      </td>
      <td className="py-2 pr-4 text-black/60">{item.unit || "—"}</td>
      <td className="py-2">
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`${common("delete")}: "${item.name}"?`)) {
                deleteInventoryItem(item.id);
              }
            }}
            className="text-xs text-red-600"
          >
            {common("delete")}
          </button>
        )}
      </td>
    </tr>
  );
}
