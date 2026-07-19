import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { checklistLabel } from "@/lib/checklist-label";
import { ChecklistForm } from "@/components/checklist-form";
import type { ChecklistItemView } from "@/lib/types";

export default async function EventChecklistPage({
  params,
}: {
  params: Promise<{ id: string; checklistId: string }>;
}) {
  const { id: eventId, checklistId } = await params;
  const t = await getTranslations("event");
  const templatesT = await getTranslations("checklistTemplates");
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: checklist } = await supabase
    .from("event_checklists")
    .select("id, template_id, name, status, checklist_templates(id, code)")
    .eq("id", checklistId)
    .single();

  if (!checklist) notFound();

  const [{ data: templateItems }, { data: statuses }] = await Promise.all([
    supabase
      .from("checklist_template_items")
      .select("id, section, label, sort_order, extra")
      .eq("template_id", checklist.template_id)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("event_checklist_items")
      .select("template_item_id, checked, note")
      .eq("event_checklist_id", checklistId),
  ]);

  const statusByItemId = new Map(
    (statuses ?? []).map((s) => [s.template_item_id, s]),
  );

  const items: ChecklistItemView[] = (templateItems ?? []).map((item) => {
    const status = statusByItemId.get(item.id);
    return {
      templateItemId: item.id,
      section: item.section,
      label: item.label,
      sortOrder: item.sort_order,
      templateExtra: item.extra,
      checked: status?.checked ?? false,
      note: status?.note ?? "",
    };
  });

  const templateCode = Array.isArray(checklist.checklist_templates)
    ? checklist.checklist_templates[0]?.code
    : (checklist.checklist_templates as { code: string } | null)?.code;

  const title =
    checklist.name ||
    (templateCode
      ? checklistLabel(templatesT, templateCode)
      : t("checklistsSection"));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <ChecklistForm
        eventId={eventId}
        checklistId={checklistId}
        items={items}
        submitted={checklist.status === "ingediend"}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}
