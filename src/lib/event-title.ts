const PENDING_SUFFIX = " (pending)";

export type ParsedTitle = {
  base: string;
  baristas: string[];
  pending: boolean;
};

// Herleidt de basistitel, barista-namen en pending-status uit een
// opgeslagen eventtitel zoals "Woezi (Lynn) (pending)".
export function parseEventTitle(title: string): ParsedTitle {
  let t = title;
  let pending = false;
  if (t.endsWith(PENDING_SUFFIX)) {
    pending = true;
    t = t.slice(0, -PENDING_SUFFIX.length);
  }

  const match = t.match(/^(.*)\s\(([^()]+)\)$/);
  if (match) {
    const baristas = match[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return { base: match[1], baristas, pending };
  }

  return { base: t, baristas: [], pending };
}

// Bouwt de opgeslagen eventtitel op uit de basistitel + barista-namen +
// pending-status. Enkel het resultaat hiervan wordt in `events.title`
// bewaard, zodat we nooit op de ruwe tekst hoeven te patchen.
export function buildEventTitle(
  base: string,
  baristas: string[],
  pending: boolean,
): string {
  const names = baristas.map((s) => s.trim()).filter(Boolean);
  let title = base.trim();
  if (names.length > 0) title += ` (${names.join(", ")})`;
  if (pending) title += PENDING_SUFFIX;
  return title;
}
