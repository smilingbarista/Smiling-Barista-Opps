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
  const admin = useTranslations("admin");
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const selected = templates.find((t) => t.id === selectedId);
  const selectedItems = selected ? itemsByTemplate[selected.id] ?? [] : [];
  const selectedTitle = selected
    ? checklistLabel(templatesT, selected.code)
    : "";

  function printTemplate() {
    const previousTitle = document.title;
    document.title = selectedTitle;
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={printTemplate}
            className="no-print rounded border border-brand px-3 py-1.5 text-sm text-brand"
          >
            {admin("exportTemplatePdf")}
          </button>
        )}
      </div>

      {selected && (
        <TemplateManager
          templateId={selected.id}
          code={selected.code}
          items={selectedItems}
        />
      )}

      {selected && (
        <div className="template-print-area" aria-hidden="true">
          <h1>{selectedTitle}</h1>
          <div className="template-print-items">
            {selectedItems
              .filter((item) => item.active)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item, index, activeItems) => (
                <div key={item.id} className="template-print-item">
                  {item.section &&
                    (index === 0 ||
                      activeItems[index - 1].section !== item.section) && (
                      <h2>{item.section}</h2>
                    )}
                  <label>
                    <input type="checkbox" disabled />
                    <span>{item.label}</span>
                  </label>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
