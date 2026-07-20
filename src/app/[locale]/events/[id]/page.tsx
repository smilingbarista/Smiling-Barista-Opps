import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { checklistLabel } from "@/lib/checklist-label";
import { EventDetailsForm } from "@/components/event-details-form";
import { AssignStaff } from "@/components/assign-staff";
import { AttachChecklistForm } from "@/components/attach-checklist-form";
import { EventActions } from "@/components/event-actions";
import { EventImages } from "@/components/event-images";
import type { EventRow, EventChecklistRow, EventImageRow } from "@/lib/types";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("event");
  const calendarT = await getTranslations("calendar");
  const templatesT = await getTranslations("checklistTemplates");
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (!event) notFound();

  const { data: assignments } = await supabase
    .from("event_assignments")
    .select("event_id, profile_id, profiles(full_name)")
    .eq("event_id", id);

  const { data: eventChecklists } = await supabase
    .from("event_checklists")
    .select(
      "id, event_id, template_id, name, status, submitted_by, submitted_at, checklist_templates(id, code), profiles(full_name)",
    )
    .eq("event_id", id);

  const { data: allTemplates } = await supabase
    .from("checklist_templates")
    .select("id, code");

  const { data: images } = await supabase
    .from("event_images")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  const attachedTemplateIds = new Set(
    (eventChecklists ?? []).map((c) => c.template_id),
  );
  const availableTemplates = (allTemplates ?? []).filter(
    (tpl) => !attachedTemplateIds.has(tpl.id),
  );

  let allProfiles: { id: string; full_name: string }[] = [];
  if (profile?.role === "admin") {
    const { data } = await supabase.from("profiles").select("id, full_name");
    allProfiles = data ?? [];
  }

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {(event as EventRow).title}
          {(event as EventRow).status === "gearchiveerd" && (
            <span className="ml-2 rounded bg-black/10 px-2 py-0.5 text-xs font-normal text-black/60">
              {t("archived")}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/events/${id}/briefing`}
            className="rounded border border-brand px-3 py-1.5 text-sm text-brand hover:bg-brand hover:text-brand-foreground"
          >
            {t("generateBriefing")}
          </Link>
          {isAdmin && <EventActions eventId={id} />}
        </div>
      </div>

      <EventDetailsForm event={event as EventRow} readOnly={!isAdmin} />

      <EventImages
        eventId={id}
        images={(images ?? []) as EventImageRow[]}
        readOnly={!isAdmin}
      />

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">{calendarT("assignedTo")}</h2>
        <ul className="flex flex-wrap gap-2">
          {(assignments ?? []).map((a) => (
            <li
              key={a.profile_id}
              className="rounded-full bg-black/5 px-3 py-1 text-sm"
            >
              {(a.profiles as unknown as { full_name: string } | null)
                ?.full_name ?? a.profile_id}
            </li>
          ))}
        </ul>
        {isAdmin && (
          <AssignStaff
            eventId={id}
            profiles={allProfiles}
            assignedIds={(assignments ?? []).map((a) => a.profile_id)}
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">{t("checklistsSection")}</h2>
        {(!eventChecklists || eventChecklists.length === 0) && (
          <p className="text-sm text-black/50">{t("noChecklists")}</p>
        )}
        <ul className="flex flex-col gap-2">
          {((eventChecklists ?? []) as unknown as EventChecklistRow[]).map(
            (c) => (
              <li key={c.id}>
                <Link
                  href={`/events/${id}/checklists/${c.id}`}
                  className="flex items-center justify-between rounded border border-black/10 px-4 py-2 hover:border-brand"
                >
                  <span>
                    {c.name ||
                      (c.checklist_templates
                        ? checklistLabel(templatesT, c.checklist_templates.code)
                        : "")}
                  </span>
                  <span
                    className={
                      c.status === "ingediend"
                        ? "text-sm text-green-700"
                        : "text-sm text-black/50"
                    }
                  >
                    {c.status === "ingediend"
                      ? `${t("statusSubmitted")} — ${c.profiles?.full_name ?? ""}`
                      : t("statusOpen")}
                  </span>
                </Link>
              </li>
            ),
          )}
        </ul>
        {availableTemplates.length > 0 && (
          <AttachChecklistForm
            eventId={id}
            templates={availableTemplates}
          />
        )}
      </section>
    </div>
  );
}
