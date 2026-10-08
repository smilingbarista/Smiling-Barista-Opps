export type RecurringTaskFrequency = "daily" | "weekly" | "monthly";

const TIME_ZONE = "Europe/Brussels";

export function getRecurringTaskPeriodStart(
  frequency: RecurringTaskFrequency,
  now = new Date(),
  scheduleDay = 1,
) {
  const parts = getLocalParts(now);

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour);
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(
    parts.weekday,
  );
  const localDate = new Date(Date.UTC(year, month - 1, day));

  if (frequency === "daily") {
    if (hour < 5) localDate.setUTCDate(localDate.getUTCDate() - 1);
  } else if (frequency === "weekly") {
    localDate.setUTCDate(localDate.getUTCDate() - weekday);
    if (weekday === 0 && hour < 5) localDate.setUTCDate(localDate.getUTCDate() - 7);
  } else {
    let dueDay = Math.min(scheduleDay, daysInMonth(year, month));
    if (day < dueDay || (day === dueDay && hour < 5)) {
      localDate.setUTCDate(1);
      localDate.setUTCMonth(localDate.getUTCMonth() - 1);
      dueDay = Math.min(
        scheduleDay,
        daysInMonth(localDate.getUTCFullYear(), localDate.getUTCMonth() + 1),
      );
    }
    localDate.setUTCDate(dueDay);
  }

  return localDate.toISOString().slice(0, 10);
}

export function getNextRecurringTaskDueDate(
  frequency: RecurringTaskFrequency,
  scheduleDay = 1,
  now = new Date(),
) {
  const parts = getLocalParts(now);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const localDate = new Date(Date.UTC(year, month - 1, day));

  if (frequency === "daily") return localDate.toISOString().slice(0, 10);

  if (frequency === "weekly") {
    const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(
      parts.weekday,
    );
    localDate.setUTCDate(localDate.getUTCDate() + ((scheduleDay - 1 - weekday + 7) % 7));
  } else {
    const dueDay = Math.min(scheduleDay, daysInMonth(year, month));
    if (day > dueDay) localDate.setUTCMonth(localDate.getUTCMonth() + 1, 1);
    localDate.setUTCDate(Math.min(scheduleDay, daysInMonth(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth() + 1,
    )));
  }

  return localDate.toISOString().slice(0, 10);
}

function getLocalParts(now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((values, part) => {
      values[part.type] = part.value;
      return values;
    }, {});
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}