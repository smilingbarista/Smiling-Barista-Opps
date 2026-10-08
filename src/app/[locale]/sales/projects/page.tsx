import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getGmailSalesThreads } from "@/lib/gmail-sales";
import { createClient } from "@/lib/supabase/server";
import { SalesTabs } from "@/components/sales-tabs";
import { saveProjectName } from "../actions";

export const dynamic = "force-dynamic";

export default async function SalesProjectsPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/");

  const t = await getTranslations("sales");
  let configured = false;
  let failed = false;
  let threads: Awaited<ReturnType<typeof getGmailSalesThreads>>["threads"] = [];
  try {
    ({ configured, threads } = await getGmailSalesThreads());
  } catch {
    failed = true;
  }

  const supabase = await createClient();
  const { data: projects, error: projectsError } = await supabase
    .from("sales_projects")
    .select("gmail_thread_id, project_name, original_subject");
  const projectNames = new Map(
    (projects ?? []).map((project) => [project.gmail_thread_id, project.project_name]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-brand">Sales</p>
        <h1 className="text-xl font-semibold">{t("projectsTitle")}</h1>
      </div>
      <SalesTabs active="projects" />

      {projectsError && (
        <p role="alert" className="text-sm text-red-700">
          {t("projectsLoadError")}
        </p>
      )}
      {!configured && !failed && (
        <p className="text-sm text-black/60">{t("notConfigured")}</p>
      )}
      {failed && (
        <p role="alert" className="text-sm text-red-700">{t("loadError")}</p>
      )}
      {configured && !failed && !projectsError && threads.length === 0 && (
        <p className="text-sm text-black/60">{t("empty")}</p>
      )}

      {configured && !failed && !projectsError && threads.length > 0 && (
        <div className="overflow-x-auto rounded border border-black/10">
          <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase text-black/60">
              <tr>
                <th className="px-4 py-3 font-medium">{t("projectName")}</th>
                <th className="px-4 py-3 font-medium">{t("originalSubject")}</th>
                <th className="px-4 py-3 font-medium">{t("from")}</th>
                <th className="px-4 py-3 font-medium">{t("open")}</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread.id} className="border-t border-black/10 align-top">
                  <td className="min-w-64 px-4 py-3">
                    <form action={saveProjectName} className="flex items-center gap-2">
                      <input type="hidden" name="thread_id" value={thread.id} />
                      <input
                        type="hidden"
                        name="original_subject"
                        value={thread.subject}
                      />
                      <input
                        aria-label={t("projectName")}
                        name="project_name"
                        required
                        maxLength={200}
                        defaultValue={projectNames.get(thread.id) ?? thread.subject}
                        placeholder={t("projectNamePlaceholder")}
                        className="min-w-0 flex-1 rounded border border-black/15 px-2 py-1"
                      />
                      <button
                        type="submit"
                        className="whitespace-nowrap rounded bg-brand px-3 py-1.5 text-xs text-brand-foreground hover:opacity-90"
                      >
                        {t("saveProjectName")}
                      </button>
                    </form>
                  </td>
                  <td className="max-w-sm px-4 py-3 text-black/70">
                    {thread.subject || t("noSubject")}
                  </td>
                  <td className="px-4 py-3">{thread.contact?.email || thread.from}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://mail.google.com/mail/u/0/#all/${encodeURIComponent(thread.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="whitespace-nowrap text-brand underline underline-offset-2"
                    >
                      {t("open")}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}