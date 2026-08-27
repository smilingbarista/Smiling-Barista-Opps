"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { refreshWorkshops } from "@/app/[locale]/kalender/actions";

export function RefreshWorkshopsButton() {
  const t = useTranslations("workshops");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await refreshWorkshops();
          router.refresh();
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        })
      }
      className="no-print rounded border border-black/20 px-3 py-1.5 text-sm disabled:opacity-50"
    >
      {pending ? t("refreshing") : done ? t("refreshed") : t("refresh")}
    </button>
  );
}
