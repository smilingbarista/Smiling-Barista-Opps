import { openDB, DBSchema } from "idb";
import type { ChecklistItemSave } from "@/app/[locale]/events/[id]/checklists/[checklistId]/actions";

interface QueueDB extends DBSchema {
  "pending-saves": {
    key: string;
    value: {
      checklistId: string;
      eventId: string;
      items: ChecklistItemSave[];
    };
  };
}

const dbPromise =
  typeof window !== "undefined"
    ? openDB<QueueDB>("veloprep-offline", 2, {
        upgrade(db) {
          if (db.objectStoreNames.contains("pending-toggles" as never)) {
            db.deleteObjectStore("pending-toggles" as never);
          }
          if (!db.objectStoreNames.contains("pending-saves")) {
            db.createObjectStore("pending-saves", { keyPath: "checklistId" });
          }
        },
      })
    : null;

export async function queueSave(
  checklistId: string,
  eventId: string,
  items: ChecklistItemSave[],
) {
  const db = await dbPromise;
  if (!db) return;
  await db.put("pending-saves", { checklistId, eventId, items });
}

export async function getQueuedSaves() {
  const db = await dbPromise;
  if (!db) return [];
  return db.getAll("pending-saves");
}

export async function clearQueuedSave(checklistId: string) {
  const db = await dbPromise;
  if (!db) return;
  await db.delete("pending-saves", checklistId);
}

export async function flushQueue(
  saveFn: (
    eventId: string,
    checklistId: string,
    items: ChecklistItemSave[],
  ) => Promise<void>,
) {
  const pending = await getQueuedSaves();
  for (const entry of pending) {
    try {
      await saveFn(entry.eventId, entry.checklistId, entry.items);
      await clearQueuedSave(entry.checklistId);
    } catch {
      // Still offline or server error — leave queued and retry on next flush.
    }
  }
}
