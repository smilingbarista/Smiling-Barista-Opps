import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getGmailSalesThreads } from "@/lib/gmail-sales";
import { saveCustomerContact } from "./actions";
import { SalesTabs } from "@/components/sales-tabs";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/");

  const t = await getTranslations("sales");
  const locale = await getLocale();
  let configured = false;
  let threads = [] as Awaited<ReturnType<typeof getGmailSalesThreads>>["threads"];
  let failed = false;

  try {
    ({ configured, threads } = await getGmailSalesThreads());
  } catch {
    failed = true;
  }

  const formatDate = (value: string) => {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(timestamp);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-brand">Sales</p>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </div>
      <SalesTabs active="leads" />

      {!configured && <p className="text-sm text-black/60">{t("notConfigured")}</p>}
      {configured && failed && (
        <p role="alert" className="text-sm text-red-700">
          {t("loadError")}
        </p>
      )}
      {configured && !failed && threads.length === 0 && (
        <p className="text-sm text-black/60">{t("empty")}</p>
      )}

      {configured && !failed && threads.length > 0 && (
        <div className="overflow-x-auto rounded border border-black/10">
          <table className="w-full min-w-[62rem] border-collapse text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase text-black/60">
              <tr>
                <th className="px-4 py-3 font-medium">{t("subject")}</th>
                <th className="px-4 py-3 font-medium">{t("from")}</th>
                <th className="px-4 py-3 font-medium">{t("lastMessage")}</th>
                <th className="px-4 py-3 font-medium">{t("open")}</th>
                <th className="px-4 py-3 font-medium">{t("contactSave")}</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread.id} className="border-t border-black/10 align-top">
                  <td className="max-w-md px-4 py-3">
                    <p className="font-medium">
                      {thread.subject || t("noSubject")}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-black/60">
                      {thread.snippet}
                    </p>
                  </td>
                  <td className="px-4 py-3">{thread.from}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDate(thread.date)}
                  </td>
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
                  <td className="px-4 py-3">
                    {thread.contact ? (
                      <details className="min-w-56">
                        <summary className="cursor-pointer whitespace-nowrap text-brand underline underline-offset-2">
                          {t("reviewSave")}
                        </summary>
                        <form action={saveCustomerContact} className="mt-3 flex flex-col gap-2">
                          <input type="hidden" name="thread_id" value={thread.id} />
                          <label className="flex flex-col gap-1 text-xs">
                            {t("contactName")}
                            <input
                              name="name"
                              required
                              maxLength={160}
                              defaultValue={thread.contact.name}
                              className="rounded border border-black/15 px-2 py-1 text-sm"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs">
                            {t("contactCompany")}
                            <input
                              name="company"
                              maxLength={200}
                              defaultValue={thread.contact.company}
                              className="rounded border border-black/15 px-2 py-1 text-sm"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs">
                            {t("contactEmail")}
                            <input
                              name="email"
                              type="email"
                              required
                              defaultValue={thread.contact.email}
                              className="rounded border border-black/15 px-2 py-1 text-sm"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs">
                            {t("contactPhone")}
                            <input
                              name="phone"
                              type="tel"
                              maxLength={80}
                              defaultValue={thread.contact.phone}
                              className="rounded border border-black/15 px-2 py-1 text-sm"
                            />
                          </label>
                          <button
                            type="submit"
                            className="mt-1 rounded bg-brand px-3 py-2 text-sm text-brand-foreground hover:opacity-90"
                          >
                            {t("saveContact")}
                          </button>
                        </form>
                      </details>
                    ) : (
                      <span className="text-xs text-black/50">{t("noExternalSender")}</span>
                    )}
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