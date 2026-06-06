const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function formatRelative(date: Date | string | number): string {
  const target = typeof date === "object" ? date : new Date(date);
  let duration = (target.getTime() - Date.now()) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RTF.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return RTF.format(Math.round(duration), "year");
}

export function formatAbsolute(date: Date | string | number): string {
  const target = typeof date === "object" ? date : new Date(date);
  return target.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Seconds elapsed since `timestamp`, clamped at zero. Returns `null` for
 * missing/unparseable inputs so callers can distinguish "no data yet" from
 * "data exists but is fresh". Pass `now` to keep results stable across a
 * render or to inject a fixed clock in tests.
 */
export function secondsSince(
  timestamp: string | Date | number | null | undefined,
  now: number = Date.now(),
): number | null {
  if (timestamp == null) return null;
  const ms = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, (now - ms) / 1000);
}

/**
 * Short freshness label for polled UI: "Updated just now", "Updated 12s ago",
 * "Updated 5m ago", "Updated 2h ago". Caller passes a non-negative second count.
 */
export function formatSecondsAgo(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  if (safe < 5) return "Updated just now";
  if (safe < 60) return `Updated ${safe}s ago`;
  const minutes = Math.round(safe / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `Updated ${hours}h ago`;
}
