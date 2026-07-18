"use client";

import { useTranslations } from "next-intl";
import { assignProfile } from "@/app/[locale]/events/[id]/actions";

export function AssignStaff({
  eventId,
  profiles,
  assignedIds,
}: {
  eventId: string;
  profiles: { id: string; full_name: string }[];
  assignedIds: string[];
}) {
  const common = useTranslations("common");
  const available = profiles.filter((p) => !assignedIds.includes(p.id));

  if (available.length === 0) return null;

  return (
    <form
      action={(formData) => assignProfile(eventId, formData)}
      className="flex items-end gap-2"
    >
      <select
        name="profile_id"
        required
        className="rounded border border-black/20 px-2 py-1 text-sm"
      >
        {available.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded bg-brand px-3 py-1.5 text-sm text-brand-foreground"
      >
        {common("save")}
      </button>
    </form>
  );
}
