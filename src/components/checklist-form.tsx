"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  saveChecklistItems,
  submitChecklist,
  recallChecklist,
  type ChecklistItemSave,
} from "@/app/[locale]/events/[id]/checklists/[checklistId]/actions";
import { queueSave, flushQueue } from "@/lib/offline-queue";
import type { ChecklistItemView } from "@/lib/types";

type ItemState = { checked: boolean; note: string };

export function ChecklistForm({
  eventId,
  checklistId,
  items,
  submitted,
  isAdmin,
}: {
  eventId: string;
  checklistId: string;
  items: ChecklistItemView[];
  submitted: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations("event");
  const [state, setState] = useState<Record<string, ItemState>>(
    Object.fromEntries(
      items.map((i) => [i.templateItemId, { checked: i.checked, note: i.note }]),
    ),
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [offline, setOffline] = useState(false);
  const [saved, setSaved] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    flushQueue((eId, cId, saveItems) => saveChecklistItems(eId, cId, saveItems));
    function onOnline() {
      flushQueue((eId, cId, saveItems) => saveChecklistItems(eId, cId, saveItems));
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  function toggleExpanded(templateItemId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(templateItemId)) next.delete(templateItemId);
      else next.add(templateItemId);
      return next;
    });
  }

  function updateItem(templateItemId: string, patch: Partial<ItemState>) {
    setState((prev) => ({
      ...prev,
      [templateItemId]: { ...prev[templateItemId], ...patch },
    }));
    setSaved(false);
  }

  function collectItems(): ChecklistItemSave[] {
    return items.map((i) => ({
      templateItemId: i.templateItemId,
      checked: state[i.templateItemId]?.checked ?? false,
      note: state[i.templateItemId]?.note ?? "",
    }));
  }

  async function handleSave() {
    const saveItems = collectItems();
    try {
      await saveChecklistItems(eventId, checklistId, saveItems);
      setOffline(false);
      setSaved(true);
    } catch {
      await queueSave(checklistId, eventId, saveItems);
      setOffline(true);
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const saveItems = collectItems();
      try {
        await submitChecklist(eventId, checklistId, saveItems);
      } catch {
        await queueSave(checklistId, eventId, saveItems);
        setOffline(true);
      }
    });
  }

  const sections = Array.from(new Set(items.map((i) => i.section ?? "")));

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section} className="flex flex-col gap-2">
          {section && <h2 className="font-medium">{section}</h2>}
          {items
            .filter((i) => (i.section ?? "") === section)
            .map((item) => {
              const itemState = state[item.templateItemId];
              const isExpanded = expanded.has(item.templateItemId);
              return (
                <div
                  key={item.templateItemId}
                  className="rounded border border-black/10 px-3 py-2 text-sm"
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={submitted}
                      checked={!!itemState?.checked}
                      onChange={(e) =>
                        updateItem(item.templateItemId, {
                          checked: e.target.checked,
                        })
                      }
                    />
                    <span
                      className={
                        "flex-1 cursor-pointer " +
                        (itemState?.checked ? "line-through text-black/40" : "")
                      }
                      onClick={() => toggleExpanded(item.templateItemId)}
                    >
                      {item.label}
                    </span>
                  </label>
                  {isExpanded && (
                    <input
                      type="text"
                      disabled={submitted}
                      value={itemState?.note ?? ""}
                      placeholder={item.templateExtra || t("extra")}
                      onChange={(e) =>
                        updateItem(item.templateItemId, { note: e.target.value })
                      }
                      className="mt-2 w-full rounded border border-black/20 px-2 py-1 text-xs"
                    />
                  )}
                </div>
              );
            })}
        </div>
      ))}

      {!submitted && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="rounded border border-brand px-4 py-2 text-brand hover:bg-brand hover:text-brand-foreground"
          >
            {t("save")}
          </button>
          <button
            disabled={isPending}
            onClick={handleSubmit}
            className="rounded bg-brand px-4 py-2 text-brand-foreground disabled:opacity-50"
          >
            {t("submitToAdmin")}
          </button>
          {offline && (
            <span className="text-xs text-black/40">⏳ {t("offlineQueued")}</span>
          )}
          {saved && !offline && (
            <span className="text-xs text-green-700">{t("savedNote")}</span>
          )}
        </div>
      )}
      {submitted && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-green-700">{t("statusSubmitted")}</p>
          {isAdmin && (
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await recallChecklist(eventId, checklistId);
                })
              }
              className="rounded border border-black/20 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {t("recall")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
