"use client";

import { useTranslations } from "next-intl";
import { addTemplateItem, deleteTemplate } from "@/app/[locale]/admin/checklists/actions";
import { checklistLabel } from "@/lib/checklist-label";
import { TemplateItemRow } from "@/components/template-item-row";
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
            <TemplateItemRow key={item.id} item={item} />
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
