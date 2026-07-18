"use client";

import { useTranslations } from "next-intl";
import { attachChecklist } from "@/app/[locale]/events/[id]/actions";
import { checklistLabel } from "@/lib/checklist-label";

export function AttachChecklistForm({
  eventId,
  templates,
}: {
  eventId: string;
  templates: { id: string; code: string }[];
}) {
  const t = useTranslations("event");
  const templatesT = useTranslations("checklistTemplates");

  return (
    <form
      action={(formData) => attachChecklist(eventId, formData)}
      className="flex items-end gap-2"
    >
      <select
        name="template_id"
        required
        className="rounded border border-black/20 px-2 py-1 text-sm"
      >
        {templates.map((tpl) => (
          <option key={tpl.id} value={tpl.id}>
            {checklistLabel(templatesT, tpl.code)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded bg-brand px-3 py-1.5 text-sm text-brand-foreground"
      >
        {t("attachChecklist")}
      </button>
    </form>
  );
}
