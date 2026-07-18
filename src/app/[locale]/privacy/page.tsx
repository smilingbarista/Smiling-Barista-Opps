import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p>{t("intro")}</p>
      <p>{t("dataCollected")}</p>
      <p>{t("retention")}</p>
      <p>{t("rights")}</p>
    </div>
  );
}
