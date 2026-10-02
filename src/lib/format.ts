// Dates are stored at UTC midnight, so always format in UTC to avoid
// off-by-one-day/month shifts in other timezones.
const monthYear = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const year = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "UTC" });
const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatMonthYear(value: string | null | undefined): string {
  const date = parse(value);
  return date ? monthYear.format(date) : "";
}

export function formatFullDate(value: string | null | undefined): string {
  const date = parse(value);
  return date ? fullDate.format(date) : "";
}

/** "Jan 2023 - Apr 2024", "Jan 2023 - Present", or years only ("2020 - 2024"). */
export function formatPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  options: { granularity?: "month" | "year"; current?: boolean } = {},
): string {
  const fmt = options.granularity === "year" ? year : monthYear;
  const s = parse(start);
  const e = parse(end);
  if (!s) return "";
  const endLabel = e && !options.current ? fmt.format(e) : "Present";
  return `${fmt.format(s)} - ${endLabel}`;
}

/** Event-style range: "Aug 23 - 25, 2023", "Aug 30 - Sep 2, 2023", or a single day. */
export function formatEventRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = parse(start);
  const e = parse(end);
  if (!s) return "";
  if (!e || e.getTime() === s.getTime()) return fullDate.format(s);
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  if (!sameYear) return `${fullDate.format(s)} - ${fullDate.format(e)}`;
  const sameMonth = s.getUTCMonth() === e.getUTCMonth();
  const endPart = sameMonth ? String(e.getUTCDate()) : monthDay.format(e);
  return `${monthDay.format(s)} - ${endPart}, ${e.getUTCFullYear()}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
