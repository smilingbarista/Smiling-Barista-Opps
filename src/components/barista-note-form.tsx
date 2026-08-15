"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateBaristaNote } from "@/app/[locale]/events/[id]/actions";

function BaristaNameFields({
  initial,
  readOnly,
}: {
  initial: string[];
  readOnly: boolean;
}) {
  const t = useTranslations("event");
  const [names, setNames] = useState<string[]>(
    initial.length > 0 ? initial : [""],
  );

  return (
    <div className="flex flex-col gap-2">
      {names.map((name, i) => (
        <input
          key={i}
          type="text"
          name="barista"
          value={name}
          readOnly={readOnly}
          onChange={(e) =>
            setNames((prev) =>
              prev.map((n, idx) => (idx === i ? e.target.value : n)),
            )
          }
          className={`rounded border px-2 py-1 text-sm ${
            readOnly ? "border-transparent bg-black/5" : "border-black/20"
          }`}
        />
      ))}
      {!readOnly && (
        <button
          type="button"
          onClick={() => setNames((prev) => [...prev, ""])}
          className="self-start text-xs text-brand underline"
        >
          {t("addBarista")}
        </button>
      )}
    </div>
  );
}

export function BaristaNoteForm({
  eventId,
  baristaNames,
  baristaConfirmed,
  baristaTentativeOtherJob,
  readOnly,
}: {
  eventId: string;
  baristaNames: string[];
  baristaConfirmed: boolean;
  baristaTentativeOtherJob: boolean;
  readOnly: boolean;
}) {
  const t = useTranslations("event");
  const common = useTranslations("common");
  const [confirmed, setConfirmed] = useState(baristaConfirmed);

  return (
    <form
      action={(formData) => updateBaristaNote(eventId, formData)}
      className="flex flex-col gap-2 rounded border border-black/10 p-3"
    >
      <span className="text-sm font-medium">{t("extraBaristaSection")}</span>

      <BaristaNameFields initial={baristaNames} readOnly={readOnly} />

      {!readOnly && (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="barista_confirmed"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            {t("baristaConfirmed")}
          </label>
          <label
            className={`flex items-center gap-2 text-sm ${confirmed ? "opacity-40" : ""}`}
          >
            <input
              type="checkbox"
              name="barista_tentative_other_job"
              defaultChecked={baristaTentativeOtherJob}
              disabled={confirmed}
            />
            {t("tentativeOtherJob")}
          </label>
          <button
            type="submit"
            className="self-start rounded bg-brand px-3 py-1.5 text-sm text-brand-foreground"
          >
            {common("save")}
          </button>
        </>
      )}
    </form>
  );
}
