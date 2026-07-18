"use client";

import { useEffect, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaEnrollPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [canSkip, setCanSkip] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setCanSkip(profile?.role !== "admin");

      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp && factors.totp.length > 0) {
        router.push("/dashboard");
        return;
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (enrollError) {
        setError(enrollError.message);
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError(challengeError.message);
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-xl font-semibold">{t("mfaEnrollTitle")}</h1>
      <p className="mb-4 text-sm text-black/70">{t("mfaEnrollHint")}</p>

      {qrCode && (
        <div className="mb-4 flex flex-col items-center gap-2">
          {/* Supabase returns an inline SVG data URI for the QR code */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="QR code" width={200} height={200} />
          {secret && (
            <p className="break-all text-xs text-black/50">{secret}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("mfaCode")}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded border border-black/20 px-3 py-2 tracking-widest"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !factorId}
          className="mt-2 rounded bg-brand px-4 py-2 text-brand-foreground disabled:opacity-50"
        >
          {t("mfaEnrollSubmit")}
        </button>
        {canSkip && (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm text-black/50 underline"
          >
            {t("mfaEnrollSkip")}
          </button>
        )}
      </form>
    </div>
  );
}
