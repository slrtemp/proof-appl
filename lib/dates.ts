export function getDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getDateRangeStart(dateKey: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}
