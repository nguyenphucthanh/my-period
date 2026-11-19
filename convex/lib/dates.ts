const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_PERIOD_DAYS = 31;

export function isValidIsoDate(s: string): boolean {
  if (!ISO.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function daysBetween(from: string, to: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(to) - t(from)) / 86_400_000);
}

/** Today's UTC date plus one day of slack, so users ahead of UTC can still pick "today". */
export function latestAllowedDate(now: number = Date.now()): string {
  return new Date(now + 86_400_000).toISOString().slice(0, 10);
}
