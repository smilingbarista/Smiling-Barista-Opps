"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createBackupNow } from "@/app/[locale]/admin/backup/actions";

export function BackupButton() {
  const t = useTranslations("backup");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setDone(false);
            await createBackupNow();
            setDone(true);
          })
        }
        className="self-start rounded bg-brand px-4 py-2 text-sm text-brand-foreground disabled:opacity-50"
      >
        {isPending ? t("creating") : t("createBackup")}
      </button>
      {done && <span className="text-sm text-green-700">{t("created")}</span>}
    </div>
  );
}
