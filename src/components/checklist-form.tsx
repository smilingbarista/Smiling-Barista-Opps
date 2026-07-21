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
import { AutosizeTextarea } from "@/components/autosize-textarea";
import { usesPerItemExtra } from "@/lib/checklist-label";
import type { ChecklistItemView } from "@/lib/types";

type ItemState = { checked: boolean; note: string };

export function ChecklistForm({
  eventId,
  checklistId,
  templateCode,
  items,
  initialRemarks,
  submitted,
  isAdmin,
}: {
  eventId: string;
  checklistId: string;
  templateCode: string | null;
  items: ChecklistItemView[];
  initialRemarks: string;
  submitted: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations("event");
  const perItemExtra = usesPerItemExtra(templateCode);
  const [state, setState] = useState<Record<string, ItemState>>(
    Object.fromEntries(
      items.map((i) => [i.templateItemId, { checked: i.checked, note: i.note }]),
    ),
  );
  const [remarks, setRemarks] = useState(initialRemarks);
  const [offline, setOffline] = useState(false);
  const [saved, setSaved] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    flushQueue((eId, cId, saveItems, saveRemarks) =>
      saveChecklistItems(eId, cId, saveItems, saveRemarks),
    );
    function onOnline() {
      flushQueue((eId, cId, saveItems, saveRemarks) =>
      saveChecklistItems(eId, cId, saveItems, saveRemarks),
    );
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

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
      await saveChecklistItems(eventId, checklistId, saveItems, remarks);
      setOffline(false);
      setSaved(true);
    } catch {
      await queueSave(checklistId, eventId, saveItems, remarks);
      setOffline(true);
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const saveItems = collectItems();
      try {
        await submitChecklist(eventId, checklistId, saveItems, remarks);
      } catch {
        await queueSave(checklistId, eventId, saveItems, remarks);
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
                        itemState?.checked ? "line-through text-black/40" : ""
                      }
                    >
                      {item.label}
                    </span>
                  </label>
                  {perItemExtra && (
                    <AutosizeTextarea
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

      {!perItemExtra && (
        <label className="flex flex-col gap-1 text-sm">
          {t("checklistRemarks")}
          <AutosizeTextarea
            disabled={submitted}
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded border border-black/20 px-2 py-1 text-sm"
          />
        </label>
      )}

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
