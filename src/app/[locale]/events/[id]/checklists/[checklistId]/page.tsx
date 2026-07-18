import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { checklistLabel } from "@/lib/checklist-label";
import { ChecklistForm } from "@/components/checklist-form";
import type { EventChecklistItemRow } from "@/lib/types";

export default async function EventChecklistPage({
  params,
}: {
  params: Promise<{ id: string; checklistId: string }>;
}) {
  const { id: eventId, checklistId } = await params;
  const t = await getTranslations("event");
  const templatesT = await getTranslations("checklistTemplates");
  const supabase = await createClient();

  const { data: checklist } = await supabase
    .from("event_checklists")
    .select("id, status, checklist_templates(id, code)")
    .eq("id", checklistId)
    .single();

  if (!checklist) notFound();

  const { data: items } = await supabase
    .from("event_checklist_items")
    .select(
      "id, checked, note, checklist_template_items(id, section, label, sort_order)",
    )
    .eq("event_checklist_id", checklistId)
    .order("id");

  const sorted = ((items ?? []) as unknown as EventChecklistItemRow[]).sort(
    (a, b) =>
      a.checklist_template_items.sort_order -
      b.checklist_template_items.sort_order,
  );

  const templateCode = Array.isArray(checklist.checklist_templates)
    ? checklist.checklist_templates[0]?.code
    : (checklist.checklist_templates as { code: string } | null)?.code;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {templateCode
          ? checklistLabel(templatesT, templateCode)
          : t("checklistsSection")}
      </h1>
      <ChecklistForm
        eventId={eventId}
        checklistId={checklistId}
        items={sorted}
        submitted={checklist.status === "ingediend"}
      />
    </div>
  );
}
