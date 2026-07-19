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
