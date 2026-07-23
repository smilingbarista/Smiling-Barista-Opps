"use client";

import { useEffect, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "loading" | "mfa" | "password";

export default function SetPasswordPage() {
  const t = useTranslations("setPassword");
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      // Nieuwe (PKCE-)uitnodigingslinks bevatten token_hash + type in de
      // querystring en vereisen een expliciete verifyOtp-call. Klassieke
      // (implicit) links zetten de sessie automatisch via het #-fragment,
      // wat getSession() hieronder al afwacht.
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      if (tokenHash && (type === "invite" || type === "recovery" || type === "email")) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (verifyError) {
          setInvalid(true);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setInvalid(true);
        return;
      }

      // Een wachtwoord instellen vereist een aal2-sessie zodra het account
      // MFA heeft ingeschakeld — een recovery/invite-link geeft enkel aal1.
      // Zonder deze stap faalt updateUser() met "aal2 session is required
      // to update email or password when MFA is enabled".
      const { data: levelData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (
        levelData &&
        levelData.nextLevel === "aal2" &&
        levelData.currentLevel === "aal1"
      ) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.[0];
        if (totp) {
          const { data: challenge, error: challengeError } =
            await supabase.auth.mfa.challenge({ factorId: totp.id });
          if (challengeError) {
            setInvalid(true);
            return;
          }
          setFactorId(totp.id);
          setChallengeId(challenge.id);
          setStep("mfa");
          return;
        }
      }

      setStep("password");
    }
    init();
  }, []);

  async function handleMfaSubmit(e: FormEvent) {
    e.preventDefault();
    if (!factorId || !challengeId) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (verifyError) {
      setError(t("mfaError"));
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("password");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("tooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("mismatch"));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/auth/mfa-enroll");
    router.refresh();
  }

  if (invalid) {
    return (
      <div className="mx-auto max-w-sm">
        <p className="text-sm text-red-600">{t("invalidLink")}</p>
      </div>
    );
  }

  if (step === "loading") {
    return <div className="mx-auto max-w-sm" />;
  }

  if (step === "mfa") {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-xl font-semibold">{t("mfaTitle")}</h1>
        <p className="mb-4 text-sm text-black/70">{t("mfaHint")}</p>
        <form onSubmit={handleMfaSubmit} className="flex flex-col gap-3">
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
            disabled={loading}
            className="mt-2 rounded bg-brand px-4 py-2 text-brand-foreground disabled:opacity-50"
          >
            {t("mfaSubmit")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-xl font-semibold">{t("title")}</h1>
      <p className="mb-4 text-sm text-black/70">{t("hint")}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("password")}
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-black/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("confirmPassword")}
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded border border-black/20 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded bg-brand px-4 py-2 text-brand-foreground disabled:opacity-50"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
