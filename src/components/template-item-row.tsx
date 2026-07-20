"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  setTemplateItemActive,
  updateTemplateItem,
  deleteTemplateItem,
} from "@/app/[locale]/admin/checklists/actions";
import { AutosizeTextarea } from "@/components/autosize-textarea";
import type { ChecklistTemplateItemRow } from "@/lib/types";

export function TemplateItemRow({ item }: { item: ChecklistTemplateItemRow }) {
  const common = useTranslations("common");
  const t = useTranslations("event");
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded bg-black/5 px-2 py-2 text-sm">
        <form
          action={async (formData) => {
            await updateTemplateItem(item.id, formData);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <div className="flex flex-wrap gap-2">
            <input
              name="section"
              defaultValue={item.section ?? ""}
              placeholder="Sectie (optioneel)"
              className="rounded border border-black/20 px-2 py-1"
            />
            <input
              name="label"
              defaultValue={item.label}
              required
              placeholder="Item"
              className="flex-1 rounded border border-black/20 px-2 py-1"
            />
          </div>
          <AutosizeTextarea
            name="extra"
            defaultValue={item.extra ?? ""}
            placeholder={t("extra")}
            className="rounded border border-black/20 px-2 py-1"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-brand px-3 py-1 text-brand-foreground"
            >
              {common("save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border border-black/20 px-3 py-1"
            >
              {common("cancel")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`${common("delete")}: "${item.label}"?`)) {
                  deleteTemplateItem(item.id);
                }
              }}
              className="ml-auto rounded border border-red-600 px-3 py-1 text-red-600"
            >
              {common("delete")}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded bg-black/5 px-2 py-1 text-sm">
      <input
        type="checkbox"
        checked={!item.active}
        onChange={(e) => setTemplateItemActive(item.id, !e.target.checked)}
      />
      <span
        className={
          "flex-1 cursor-pointer " +
          (!item.active ? "line-through text-black/40" : "")
        }
        onClick={() => setEditing(true)}
      >
        {item.section ? `${item.section} — ` : ""}
        {item.label}
        {item.extra && (
          <span className="ml-2 text-xs text-black/40">({item.extra})</span>
        )}
      </span>
    </li>
  );
}
