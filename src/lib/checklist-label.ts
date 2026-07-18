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
