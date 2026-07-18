"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleItem, submitChecklist } from "@/app/[locale]/events/[id]/checklists/[checklistId]/actions";
import { queueToggle, flushQueue } from "@/lib/offline-queue";
import type { EventChecklistItemRow } from "@/lib/types";

export function ChecklistForm({
  eventId,
  checklistId,
  items,
  submitted,
}: {
  eventId: string;
  checklistId: string;
  items: EventChecklistItemRow[];
  submitted: boolean;
}) {
  const t = useTranslations("event");
  const [checkedState, setCheckedState] = useState(
    Object.fromEntries(items.map((i) => [i.id, i.checked])),
  );
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    flushQueue((eId, itemId, checked) => toggleItem(eId, itemId, checked));
    function onOnline() {
      flushQueue((eId, itemId, checked) => toggleItem(eId, itemId, checked));
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  async function handleToggle(itemId: string, checked: boolean) {
    setCheckedState((prev) => ({ ...prev, [itemId]: checked }));
    try {
      await toggleItem(eventId, itemId, checked);
    } catch {
      await queueToggle(itemId, eventId, checked);
      setPendingIds((prev) => new Set(prev).add(itemId));
    }
  }

  const sections = Array.from(
    new Set(items.map((i) => i.checklist_template_items.section ?? "")),
  );

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section} className="flex flex-col gap-2">
          {section && <h2 className="font-medium">{section}</h2>}
          {items
            .filter((i) => (i.checklist_template_items.section ?? "") === section)
            .map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  disabled={submitted}
                  checked={!!checkedState[item.id]}
                  onChange={(e) => handleToggle(item.id, e.target.checked)}
                />
                <span>{item.checklist_template_items.label}</span>
                {pendingIds.has(item.id) && (
                  <span className="ml-auto text-xs text-black/40">
                    ⏳ offline
                  </span>
                )}
              </label>
            ))}
        </div>
      ))}

      {!submitted && (
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await submitChecklist(eventId, checklistId);
            })
          }
          className="self-start rounded bg-brand px-4 py-2 text-brand-foreground disabled:opacity-50"
        >
          {t("submitToAdmin")}
        </button>
      )}
      {submitted && (
        <p className="text-sm text-green-700">{t("statusSubmitted")}</p>
      )}
    </div>
  );
}
