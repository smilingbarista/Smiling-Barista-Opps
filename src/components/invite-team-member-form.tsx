"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { inviteTeamMember } from "@/app/[locale]/admin/team/actions";

export function InviteTeamMemberForm() {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        setSent(false);
        setError(null);
        startTransition(async () => {
          try {
            await inviteTeamMember(formData);
            setSent(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        });
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <input
        name="full_name"
        placeholder={t("inviteName")}
        className="rounded border border-black/20 px-2 py-1 text-sm"
      />
      <input
        name="email"
        type="email"
        required
        placeholder={t("inviteEmail")}
        className="rounded border border-black/20 px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-brand px-3 py-1.5 text-sm text-brand-foreground disabled:opacity-50"
      >
        {isPending ? t("inviteSending") : t("inviteSubmit")}
      </button>
      {sent && <span className="text-sm text-green-700">{t("inviteSent")}</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
