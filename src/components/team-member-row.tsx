"use client";

import { useTranslations } from "next-intl";
import { updateRole, deleteProfile } from "@/app/[locale]/admin/team/actions";

export function TeamMemberRow({
  id,
  fullName,
  email,
  role,
}: {
  id: string;
  fullName: string;
  email: string;
  role: string;
}) {
  const t = useTranslations("admin");

  return (
    <tr className="border-b border-black/10">
      <td className="py-2 pr-4">{fullName}</td>
      <td className="py-2 pr-4 text-black/60">{email}</td>
      <td className="py-2 pr-4">
        <form action={(formData) => updateRole(id, formData)}>
          <select
            key={role}
            name="role"
            defaultValue={role}
            onChange={(e) => e.target.form?.requestSubmit()}
            className="rounded border border-black/20 px-2 py-1 text-sm"
          >
            <option value="medewerker">{t("roleMedewerker")}</option>
            <option value="admin">{t("roleAdmin")}</option>
          </select>
        </form>
      </td>
      <td className="flex gap-3 py-2 text-sm">
        <a href={`/api/admin/export/${id}`} className="text-brand underline">
          {t("exportData")}
        </a>
        <button
          onClick={() => {
            if (confirm(`${t("deleteProfile")}: ${fullName}?`)) {
              deleteProfile(id);
            }
          }}
          className="text-red-600 underline"
        >
          {t("deleteProfile")}
        </button>
      </td>
    </tr>
  );
}
