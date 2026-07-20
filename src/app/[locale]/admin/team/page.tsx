import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { TeamMemberRow } from "@/components/team-member-row";
import { InviteTeamMemberForm } from "@/components/invite-team-member-form";

export default async function AdminTeamPage() {
  const t = await getTranslations("admin");
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t("teamTitle")}</h1>
      <InviteTeamMemberForm />
      <table className="w-full text-left text-sm">
        <tbody>
          {(profiles ?? []).map((p) => (
            <TeamMemberRow
              key={p.id}
              id={p.id}
              fullName={p.full_name}
              email={p.email}
              role={p.role}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
