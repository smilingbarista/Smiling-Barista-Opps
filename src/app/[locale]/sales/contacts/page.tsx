import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SalesTabs } from "@/components/sales-tabs";

export const dynamic = "force-dynamic";

export default async function SalesContactsPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/");

  const t = await getTranslations("sales");
  const supabase = await createClient();
  const { data: contacts, error } = await supabase
    .from("customer_contacts")
    .select("id, name, company, email, phone, created_at")
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-brand">Sales</p>
        <h1 className="text-xl font-semibold">{t("contactsTitle")}</h1>
      </div>
      <SalesTabs active="contacts" />

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {t("contactsLoadError")}
        </p>
      ) : contacts?.length ? (
        <div className="overflow-x-auto rounded border border-black/10">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase text-black/60">
              <tr>
                <th className="px-4 py-3 font-medium">{t("contactName")}</th>
                <th className="px-4 py-3 font-medium">{t("contactCompany")}</th>
                <th className="px-4 py-3 font-medium">{t("contactEmail")}</th>
                <th className="px-4 py-3 font-medium">{t("contactPhone")}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-black/10">
                  <td className="px-4 py-3 font-medium">{contact.name}</td>
                  <td className="px-4 py-3">{contact.company || "-"}</td>
                  <td className="px-4 py-3">
                    <a className="text-brand underline underline-offset-2" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">{contact.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-black/60">{t("contactsEmpty")}</p>
      )}
    </div>
  );
}