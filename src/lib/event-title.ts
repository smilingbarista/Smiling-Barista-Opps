const PENDING_SUFFIX = " (pending)";

export type ParsedTitle = {
  base: string;
  baristas: string[];
  pending: boolean;
  baristaConfirmed: boolean;
};

// Herleidt de basistitel, barista-namen, pending-status en
// barista-bevestiging uit een opgeslagen eventtitel zoals
// "Woezi (Lynn?) (pending)".
//
// Zonder naam is er nog steeds een zichtbaar onderscheid:
// "(?)" = bevestigd dat er nog geen barista is, "(??)" = nog niet
// bevestigd (en geen naam).
export function parseEventTitle(title: string): ParsedTitle {
  let t = title;
  let pending = false;
  if (t.endsWith(PENDING_SUFFIX)) {
    pending = true;
    t = t.slice(0, -PENDING_SUFFIX.length);
  }

  const match = t.match(/^(.*)\(([^()]+)\)$/);
  if (match) {
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

// Bouwt de opgeslagen eventtitel op uit de basistitel + barista-namen +
// pending-status + barista-bevestiging. Enkel het resultaat hiervan wordt
// in `events.title` bewaard, zodat we nooit op de ruwe tekst hoeven te
// patchen.
// - Geen naam, wel bevestigd -> "(?)".
// - Geen naam, niet bevestigd -> "(??)".
// - Wel een naam, maar niet bevestigd -> "(Naam?)".
export function buildEventTitle(
  base: string,
  baristas: string[],
  pending: boolean,
  baristaConfirmed: boolean = true,
): string {
  const names = baristas.map((s) => s.trim()).filter(Boolean);
  const group =
    names.length > 0
      ? names.join(", ") + (baristaConfirmed ? "" : "?")
      : baristaConfirmed
        ? "?"
        : "??";
  let title = base.trim();
  title += ` (${group})`;
  if (pending) title += PENDING_SUFFIX;
  return title;
}
