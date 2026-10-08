import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SalesTabs({ active }: { active: "leads" | "contacts" }) {
  const t = await getTranslations("sales");

  return (
    <nav aria-label={t("salesTabs")} className="flex gap-5 border-b border-black/10">
      <Link
        href="/sales"
        aria-current={active === "leads" ? "page" : undefined}
        className={`border-b-2 px-1 pb-2 text-sm ${
          active === "leads"
            ? "border-brand font-medium text-brand"
            : "border-transparent text-black/60 hover:text-black"
        }`}
      >
        {t("leadsTab")}
      </Link>
      <Link
        href="/sales/contacts"
        aria-current={active === "contacts" ? "page" : undefined}
        className={`border-b-2 px-1 pb-2 text-sm ${
          active === "contacts"
            ? "border-brand font-medium text-brand"
            : "border-transparent text-black/60 hover:text-black"
        }`}
      >
        {t("contactsTab")}
      </Link>
    </nav>
  );
}