import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ChecklistTemplatePicker } from "@/components/checklist-template-picker";
import { createTemplate } from "./actions";
import type { ChecklistTemplateItemRow } from "@/lib/types";

export default async function AdminChecklistsPage() {
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("id, code");
  const { data: items } = await supabase
    .from("checklist_template_items")
    .select("id, template_id, section, label, sort_order, active, extra");

  const itemsByTemplate: Record<string, ChecklistTemplateItemRow[]> = {};
  for (const item of (items ?? []) as ChecklistTemplateItemRow[]) {
    (itemsByTemplate[item.template_id] ??= []).push(item);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("checklistsTitle")}</h1>

      <ChecklistTemplatePicker
        templates={templates ?? []}
        itemsByTemplate={itemsByTemplate}
      />

      <form action={createTemplate} className="flex items-end gap-2">
        <input
          name="code"
          placeholder="nieuwe_checklist_code"
          required
          className="rounded border border-black/20 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-brand px-3 py-1.5 text-sm text-brand-foreground"
        >
          {common("save")}
        </button>
      </form>
    </div>
  );
}
