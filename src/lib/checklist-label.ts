export function checklistLabel(
  t: (key: string) => string,
  code: string,
): string {
  try {
    return t(code);
  } catch {
    return code.replace(/_/g, " ");
  }
}

export function veloprepChecklistName(
  eventTitle: string,
  eventDate: string,
): string {
  return `Veloprep '${eventTitle} ${eventDate}'`;
}

// Enkel deze checklists tonen een "Extra"-veld per item; de andere tonen
// in de plaats één opmerkingenveld onderaan de hele checklist.
const PER_ITEM_EXTRA_CODES = new Set(["veloprep_uitrusting", "teambuilding_latte_art"]);

export function usesPerItemExtra(code: string | null | undefined): boolean {
  return !!code && PER_ITEM_EXTRA_CODES.has(code);
}
