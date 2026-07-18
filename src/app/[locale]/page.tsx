import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getCurrentProfile();
  redirect({ href: profile ? "/dashboard" : "/login", locale });
}
