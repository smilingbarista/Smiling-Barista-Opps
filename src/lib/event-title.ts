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
