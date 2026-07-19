"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TemplateManager } from "@/components/template-manager";
import { checklistLabel } from "@/lib/checklist-label";
import type { ChecklistTemplateItemRow } from "@/lib/types";

export function ChecklistTemplatePicker({
  templates,
  itemsByTemplate,
}: {
  templates: { id: string; code: string }[];
  itemsByTemplate: Record<string, ChecklistTemplateItemRow[]>;
}) {
  const templatesT = useTranslations("checklistTemplates");
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const selected = templates.find((t) => t.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full max-w-sm rounded border border-black/20 px-2 py-1.5 text-sm sm:w-auto"
      >
        {templates.map((tpl) => (
          <option key={tpl.id} value={tpl.id}>
            {checklistLabel(templatesT, tpl.code)}
          </option>
        ))}
      </select>

      {selected && (
        <TemplateManager
          templateId={selected.id}
          code={selected.code}
          items={itemsByTemplate[selected.id] ?? []}
        />
      )}
    </div>
  );
}
