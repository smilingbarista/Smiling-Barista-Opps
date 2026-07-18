import { openDB, DBSchema } from "idb";

interface QueueDB extends DBSchema {
  "pending-toggles": {
    key: string;
    value: { itemId: string; eventId: string; checked: boolean };
  };
}

const dbPromise =
  typeof window !== "undefined"
    ? openDB<QueueDB>("veloprep-offline", 1, {
        upgrade(db) {
          db.createObjectStore("pending-toggles", { keyPath: "itemId" });
        },
      })
    : null;

export async function queueToggle(
  itemId: string,
  eventId: string,
  checked: boolean,
) {
  const db = await dbPromise;
  if (!db) return;
  await db.put("pending-toggles", { itemId, eventId, checked });
}

export async function getQueuedToggles() {
  const db = await dbPromise;
  if (!db) return [];
  return db.getAll("pending-toggles");
}

export async function clearQueuedToggle(itemId: string) {
  const db = await dbPromise;
  if (!db) return;
  await db.delete("pending-toggles", itemId);
}

export async function flushQueue(
  toggleFn: (eventId: string, itemId: string, checked: boolean) => Promise<void>,
) {
  const pending = await getQueuedToggles();
  for (const entry of pending) {
    try {
      await toggleFn(entry.eventId, entry.itemId, entry.checked);
      await clearQueuedToggle(entry.itemId);
    } catch {
      // Still offline or server error — leave queued and retry on next flush.
    }
  }
}
