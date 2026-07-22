"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/nl/auth/set-password` },
    );
    // Rate limiting is an infrastructure error, not account info — safe (and
    // important) to surface. Any other outcome (including "no such account")
    // shows the same generic message, so this page can't be used to check
    // which addresses have an account.
    if (resetError?.status === 429) {
      setError(t("rateLimited"));
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-black/70">{t("sentHint")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-xl font-semibold">{t("title")}</h1>
      <p className="mb-4 text-sm text-black/70">{t("hint")}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
