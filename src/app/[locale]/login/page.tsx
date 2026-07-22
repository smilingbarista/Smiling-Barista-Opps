"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "password" | "mfa";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t("error"));
      setLoading(false);
      return;
    }

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
          setError(t("mfaError"));
          setLoading(false);
          return;
        }
        setFactorId(totp.id);
        setChallengeId(challenge.id);
        setStep("mfa");
        setLoading(false);
        return;
      }
    }

    router.push("/auth/mfa-enroll");
    router.refresh();
  }

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

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-xl font-semibold">
        {step === "password" ? t("title") : t("mfaTitle")}
      </h1>

      {step === "password" ? (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t("email")}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-black/20 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("password")}
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <Link
            href="/auth/forgot-password"
            className="text-center text-sm text-brand underline"
          >
            {t("forgotPassword")}
          </Link>
        </form>
      ) : (
        <form onSubmit={handleMfaSubmit} className="flex flex-col gap-3">
          <p className="text-sm text-black/70">{t("mfaHint")}</p>
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
      )}
    </div>
  );
}
