"use client";

import { useState, useTransition } from "react";
import { backfillBaristaStatus } from "@/app/[locale]/admin/backup/actions";

// Tijdelijke, eenmalige migratieknop — mag verwijderd worden (samen met de
// server action en parseEventTitle) zodra deze succesvol gedraaid en
// gecontroleerd is.
export function BackfillBaristaStatusButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-3 rounded border border-amber-300 bg-amber-50 px-4 py-3">
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Eenmalige migratie: barista-status uit titel halen</span>
        <span className="text-black/60">
          Verplaatst barista-naam/-status van de titel-tekst naar de nieuwe
          kolommen, en maakt de titel weer kaal. Eenmalig uitvoeren, daarna
          deze knop laten verwijderen.
        </span>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setResult(null);
            const { count } = await backfillBaristaStatus();
            setResult(count);
          })
        }
        className="shrink-0 rounded border border-amber-600 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      >
        {isPending ? "Bezig..." : "Migratie uitvoeren"}
      </button>
      {result !== null && (
        <span className="shrink-0 text-sm text-green-700">
          {result} events bijgewerkt
        </span>
      )}
    </div>
  );
}
