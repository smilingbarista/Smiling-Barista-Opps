export type BaristaStatus = {
  barista_names: string[];
  barista_confirmed: boolean;
  barista_tentative_other_job: boolean;
  pending: boolean;
};

// Bouwt telkens opnieuw een leesbare status-suffix op voor weergave naast de
// titel — nooit teruggelezen uit tekst (dat was de bron van de corruptie:
// een basistitel die zelf haakjes bevatte, bv. een tijdstip, werd dan
// foutief als barista-groep gelezen). Barista-naam en -status leven als
// echte kolommen op `events`; dit is een pure formatteerfunctie.
export function formatBaristaSuffix(event: BaristaStatus): string {
  const names = event.barista_names.map((s) => s.trim()).filter(Boolean);

  let group: string;
  if (names.length === 0) {
    group = "nog geen barista";
  } else {
    const status = event.barista_confirmed
      ? "bevestigd"
      : event.barista_tentative_other_job
        ? "gevraagd, evt. ook elders"
        : "gevraagd";
    group = `${names.join(", ")} — ${status}`;
  }

  let suffix = ` (${group})`;
  if (event.pending) suffix += " (nog te bevestigen)";
  return suffix;
}

const PENDING_SUFFIX = " (pending)";

export type ParsedTitle = {
  base: string;
  baristas: string[];
  pending: boolean;
  baristaConfirmed: boolean;
};

// LEGACY — enkel nog gebruikt door de eenmalige backfill-actie
// (src/app/[locale]/admin/backup/actions.ts) die de oude, in `title`
// ingebakken barista-status naar de nieuwe kolommen migreert. Niet meer
// gebruiken voor nieuwe code: eens de backfill gedraaid heeft en
// gecontroleerd is, mag deze functie samen met de aanroep verwijderd worden.
export function parseEventTitle(title: string): ParsedTitle {
  let t = title;
  let pending = false;
  if (t.endsWith(PENDING_SUFFIX)) {
    pending = true;
    t = t.slice(0, -PENDING_SUFFIX.length);
  }

  const match = t.match(/^(.*)\(([^()]+)\)$/);
  // Een echte barista/bevestigingsgroep bevat nooit cijfers (namen, "?" of
  // "??") — een basistitel die zelf op iets als "(18u-20u)" eindigt zou
  // anders foutief als die groep worden gelezen.
  if (match && !/\d/.test(match[2])) {
    const base = match[1].trim();
    let group = match[2];
    if (group === "??") {
      return { base, baristas: [], pending, baristaConfirmed: false };
    }
    if (group === "?") {
      return { base, baristas: [], pending, baristaConfirmed: true };
    }
    let baristaConfirmed = true;
    if (group.endsWith("?")) {
      baristaConfirmed = false;
      group = group.slice(0, -1);
    }
    const baristas = group
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return { base, baristas, pending, baristaConfirmed };
  }

  return { base: t, baristas: [], pending, baristaConfirmed: false };
}
