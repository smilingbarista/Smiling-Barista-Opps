// ISO 8601 weeknummer (week 1 = de week met de eerste donderdag van het jaar).
export function getIsoWeek(dateStr: string): number {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const dayNum = (date.getUTCDay() + 6) % 7; // maandag = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return (
    1 +
    Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
  );
}
