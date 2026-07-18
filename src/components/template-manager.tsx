"use client";

import { useTranslations } from "next-intl";
import {
  addTemplateItem,
  deleteTemplateItem,
  deleteTemplate,
} from "@/app/[locale]/admin/checklists/actions";
import { checklistLabel } from "@/lib/checklist-label";
import type { ChecklistTemplateItemRow } from "@/lib/types";

export function TemplateManager({
  templateId,
  code,
  items,
}: {
  templateId: string;
  code: string;
  items: ChecklistTemplateItemRow[];
}) {
  const templatesT = useTranslations("checklistTemplates");
  const common = useTranslations("common");

  return (
    <div className="flex flex-col gap-3 rounded border border-black/10 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{checklistLabel(templatesT, code)}</h2>
        <button
          onClick={() => deleteTemplate(templateId)}
          className="text-sm text-red-600"
        >
          {common("delete")}
        </button>
      </div>

      <ul className="flex flex-col gap-1">
        {items
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded bg-black/5 px-2 py-1 text-sm"
            >
              <span>
                {item.section ? `${item.section} — ` : ""}
                {item.label}
              </span>
              <button
                onClick={() => deleteTemplateItem(item.id)}
                className="text-xs text-red-600"
              >
                {common("delete")}
              </button>
            </li>
          ))}
      </ul>

      <form
        action={(formData) => addTemplateItem(templateId, formData)}
        className="flex flex-wrap items-end gap-2"
      >
        <input
          name="section"
          placeholder="Sectie (optioneel)"
          className="rounded border border-black/20 px-2 py-1 text-sm"
        />
        <input
          name="label"
          placeholder="Item"
          required
          className="rounded border border-black/20 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-brand px-3 py-1 text-sm text-brand-foreground"
        >
          {common("save")}
        </button>
      </form>
    </div>
  );
}
