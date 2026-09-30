"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  addTemplateItem,
  deleteTemplate,
  reorderTemplateItems,
} from "@/app/[locale]/admin/checklists/actions";
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
  const title = checklistLabel(templatesT, code);
  const [orderedItemIds, setOrderedItemIds] = useState(() =>
    [...items]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => item.id),
  );
  const orderedItems = [
    ...orderedItemIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item) => item !== undefined),
    ...items.filter((item) => !orderedItemIds.includes(item.id)),
  ];
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  async function dropItem(targetId: string) {
    if (!draggedItemId || draggedItemId === targetId) return;
    const nextItems = [...orderedItems];
    const sourceIndex = nextItems.findIndex((item) => item.id === draggedItemId);
    const targetIndex = nextItems.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [movedItem] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, movedItem);
    const nextItemIds = nextItems.map((item) => item.id);
    setOrderedItemIds(nextItemIds);
    setDraggedItemId(null);

    try {
      await reorderTemplateItems(templateId, nextItemIds);
    } catch {
      setOrderedItemIds(
        [...items]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => item.id),
      );
    }
  }

  return (
    <div className="template-manager-root flex flex-col gap-3 rounded border border-black/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">{title}</h2>
        <div className="no-print flex items-center gap-3">
          <button
            onClick={() => deleteTemplate(templateId)}
            className="text-sm text-red-600"
          >
            {common("delete")}
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {orderedItems.map((item) => (
          <TemplateItemRow
            key={item.id}
            item={item}
            isDragging={draggedItemId === item.id}
            onDragStart={setDraggedItemId}
            onDragEnd={() => setDraggedItemId(null)}
            onDrop={dropItem}
          />
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
