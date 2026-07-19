import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { checklistLabel } from "@/lib/checklist-label";

type ChecklistOverviewRow = {
  id: string;
  event_id: string;
  name: string | null;
  status: "open" | "ingediend";
  events: { id: string; title: string; event_date: string; status: string } | null;
  checklist_templates: { code: string } | null;
};

export default async function ChecklistsOverviewPage() {
  const t = await getTranslations("event");
  const nav = await getTranslations("nav");
  const templatesT = await getTranslations("checklistTemplates");
  const supabase = await createClient();

  const { data } = await supabase
    .from("event_checklists")
    .select(
      "id, event_id, name, status, events(id, title, event_date, status), checklist_templates(code)",
    );

  const rows = ((data ?? []) as unknown as ChecklistOverviewRow[])
    .filter((row) => row.events && row.events.status !== "gearchiveerd")
    .sort((a, b) => (b.events!.event_date).localeCompare(a.events!.event_date));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{nav("checklists")}</h1>

      {rows.length === 0 && (
        <p className="text-sm text-black/50">{t("noChecklists")}</p>
      )}

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/events/${row.event_id}/checklists/${row.id}`}
              className="flex items-center justify-between rounded border border-black/10 px-4 py-3 hover:border-brand"
            >
              <span className="flex flex-col">
                <span className="font-medium">
                  {row.name ||
                    (row.checklist_templates
                      ? checklistLabel(templatesT, row.checklist_templates.code)
                      : "")}
                </span>
                <span className="text-xs text-black/50">
                  {row.events?.title} — {row.events?.event_date}
                </span>
              </span>
              <span
                className={
                  row.status === "ingediend"
                    ? "text-sm text-green-700"
                    : "text-sm text-black/50"
                }
              >
                {row.status === "ingediend"
                  ? t("statusSubmitted")
                  : t("statusOpen")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
