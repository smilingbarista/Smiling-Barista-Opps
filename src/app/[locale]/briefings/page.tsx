import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { checklistLabel } from "@/lib/checklist-label";
import type { EventRow } from "@/lib/types";

type AssignmentJoined = {
  profile_id: string;
  event_id: string;
  events: EventRow | null;
};

type ChecklistJoined = {
  id: string;
  event_id: string;
  name: string | null;
  status: "open" | "ingediend";
  checklist_templates: { code: string } | null;
};

export default async function BriefingsPage() {
  const t = await getTranslations("event");
  const nav = await getTranslations("nav");
  const dashboardT = await getTranslations("dashboard");
  const templatesT = await getTranslations("checklistTemplates");
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const isAdmin = profile?.role === "admin";

  let members: { id: string; full_name: string }[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    members = data ?? [];
  } else if (profile) {
    members = [{ id: profile.id, full_name: profile.full_name }];
  }

  const { data: assignments } = await supabase
    .from("event_assignments")
    .select("profile_id, event_id, events(*)");

  const { data: checklists } = await supabase
    .from("event_checklists")
    .select("id, event_id, name, status, checklist_templates(code)");

  const checklistsByEvent = new Map<string, ChecklistJoined[]>();
  for (const c of (checklists ?? []) as unknown as ChecklistJoined[]) {
    const list = checklistsByEvent.get(c.event_id) ?? [];
    list.push(c);
    checklistsByEvent.set(c.event_id, list);
  }

  const eventsByMember = new Map<string, EventRow[]>();
  for (const a of (assignments ?? []) as unknown as AssignmentJoined[]) {
    if (!a.events) continue;
    if (a.events.event_date < today || a.events.status === "gearchiveerd") continue;
    const list = eventsByMember.get(a.profile_id) ?? [];
    list.push(a.events);
    eventsByMember.set(a.profile_id, list);
  }
  for (const list of eventsByMember.values()) {
    list.sort((x, y) => x.event_date.localeCompare(y.event_date));
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">{nav("briefings")}</h1>

      {members.map((member) => {
        const events = eventsByMember.get(member.id) ?? [];
        return (
          <section key={member.id} className="flex flex-col gap-3">
            <h2 className="font-medium">{member.full_name}</h2>
            {events.length === 0 && (
              <p className="text-sm text-black/50">{dashboardT("noEvents")}</p>
            )}
            <ul className="flex flex-col gap-2">
              {events.map((event) => {
                const eventChecklists = checklistsByEvent.get(event.id) ?? [];
                return (
                  <li
                    key={event.id}
                    className="flex flex-col gap-2 rounded border border-black/10 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-sm text-black/50">
                        {event.event_date}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/events/${event.id}/briefing`}
                        className="rounded border border-brand px-2 py-1 text-xs text-brand hover:bg-brand hover:text-brand-foreground"
                      >
                        {t("briefingTitle")}
                      </Link>
                      {eventChecklists.map((c) => (
                        <Link
                          key={c.id}
                          href={`/events/${event.id}/checklists/${c.id}`}
                          className={
                            c.status === "ingediend"
                              ? "rounded border border-green-700 px-2 py-1 text-xs text-green-700 hover:bg-green-700 hover:text-white"
                              : "rounded border border-black/20 px-2 py-1 text-xs hover:border-brand hover:text-brand"
                          }
                        >
                          {c.name ||
                            (c.checklist_templates
                              ? checklistLabel(templatesT, c.checklist_templates.code)
                              : "")}
                        </Link>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
