/**
 * Pure period-tracking logic. Dates are "YYYY-MM-DD" strings (no timezone).
 */
export type PeriodRange = { startDate: string; endDate: string };

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const LUTEAL_PHASE = 14;
export const MAX_RECENT_PERIODS = 6;
export const MIN_BAR_DAYS = 45;
export const MAX_BAR_DAYS = 60;
/** Gaps outside this range are treated as missed logs / outliers. */
export const MIN_CYCLE = 15;
export const MAX_CYCLE = 60;

const DAY_MS = 86_400_000;

export function parseDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Local calendar date of a JS Date as "YYYY-MM-DD". */
export function toIsoDate(local: Date): string {
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" to a JS Date at local midnight (for calendar widgets). */
export function toLocalDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: string, days: number): string {
  return formatUtc(new Date(parseDate(date).getTime() + days * DAY_MS));
}

export function diffDays(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / DAY_MS);
}

export function periodLength(p: PeriodRange): number {
  return diffDays(p.startDate, p.endDate) + 1;
}

function sortAsc<T extends PeriodRange>(periods: readonly T[]): T[] {
  return [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Periods that started after `since` (the end of the latest pregnancy), so
 * cycles from before a pregnancy never mix with cycles after it.
 */
export function afterCutoff<T extends PeriodRange>(
  periods: readonly T[],
  since?: string,
): T[] {
  const sorted = sortAsc(periods);
  return since ? sorted.filter((x) => x.startDate > since) : sorted;
}

export type Prediction = {
  cycleLength: number;
  periodLength: number;
  lastStart: string;
  nextStart: string;
  nextEnd: string;
  ovulation: string;
  fertileStart: string;
  fertileEnd: string;
};

const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

/** Predicts the next period and fertile window from the latest periods. */
export function predict(
  periods: readonly PeriodRange[],
  since?: string,
): Prediction | null {
  const recent = afterCutoff(periods, since).slice(-MAX_RECENT_PERIODS);
  if (recent.length === 0) return null;

  const gaps: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const gap = diffDays(recent[i - 1].startDate, recent[i].startDate);
    if (gap >= MIN_CYCLE && gap <= MAX_CYCLE) gaps.push(gap);
  }
  const cycleLength = gaps.length ? avg(gaps) : DEFAULT_CYCLE_LENGTH;
  const length = Math.max(1, avg(recent.map(periodLength)));
  const lastStart = recent[recent.length - 1].startDate;
  const nextStart = addDays(lastStart, cycleLength);
  const ovulation = addDays(nextStart, -LUTEAL_PHASE);
  return {
    cycleLength,
    periodLength: length,
    lastStart,
    nextStart,
    nextEnd: addDays(nextStart, length - 1),
    ovulation,
    fertileStart: addDays(ovulation, -5),
    fertileEnd: addDays(ovulation, 1),
  };
}

export type CycleAnomaly =
  /** Gap between two logged periods is longer than MAX_CYCLE. */
  | { kind: "long-gap"; from: string; to: string; days: number }
  /** No period logged for longer than MAX_CYCLE since the last one. */
  | { kind: "overdue"; from: string; days: number };

/**
 * Flags unusually long gaps between recent periods, and a current cycle that
 * has run past MAX_CYCLE. Typical causes: forgot to log, or pregnancy.
 * These gaps are ignored by `predict`, so surface them to the user.
 */
export function detectAnomalies(
  periods: readonly PeriodRange[],
  today: string,
  since?: string,
): CycleAnomaly[] {
  const recent = afterCutoff(periods, since).slice(-MAX_RECENT_PERIODS);
  if (recent.length === 0) return [];
  const anomalies: CycleAnomaly[] = [];
  for (let i = 1; i < recent.length; i++) {
    const days = diffDays(recent[i - 1].startDate, recent[i].startDate);
    if (days > MAX_CYCLE)
      anomalies.push({
        kind: "long-gap",
        from: recent[i - 1].startDate,
        to: recent[i].startDate,
        days,
      });
  }
  const lastStart = recent[recent.length - 1].startDate;
  const sinceLast = diffDays(lastStart, today);
  if (sinceLast > MAX_CYCLE)
    anomalies.push({ kind: "overdue", from: lastStart, days: sinceLast });
  return anomalies;
}

/** Length used to auto-fill the end date when logging a period. */
export function suggestedPeriodLength(periods: readonly PeriodRange[]): number {
  return predict(periods)?.periodLength ?? DEFAULT_PERIOD_LENGTH;
}

export type DayKind = "period" | "peak" | "fertile" | "predicted" | "none";

export type BarDay = { date: string; kind: DayKind };

export type Bar = {
  startDate: string;
  days: BarDay[];
  /** Index of today relative to the bar start; may be outside 0..days-1. */
  todayIndex: number;
  /** Days from today until the predicted next period; <= 0 once it is due. */
  daysUntilNext: number;
  /** Days from today until ovulation in the current cycle; < 0 once passed. */
  daysUntilOvulation: number;
};

const within = (d: string, a: string, b: string) => d >= a && d <= b;

/**
 * Bar starting on the first day of the last period. At least 45 days, grown
 * (up to 60) so the whole predicted next period fits.
 */
export function buildBar(
  periods: readonly PeriodRange[],
  today: string,
  length?: number,
  since?: string,
): Bar | null {
  const prediction = predict(periods, since);
  if (!prediction) return null;
  const last = afterCutoff(periods, since).slice(-1)[0];
  const size =
    length ??
    Math.min(
      MAX_BAR_DAYS,
      Math.max(MIN_BAR_DAYS, prediction.cycleLength + prediction.periodLength),
    );
  const days: BarDay[] = Array.from({ length: size }, (_, i) => {
    const date = addDays(last.startDate, i);
    let kind: DayKind = "none";
    if (within(date, last.startDate, last.endDate)) kind = "period";
    else if (date === prediction.ovulation) kind = "peak";
    else if (within(date, prediction.fertileStart, prediction.fertileEnd))
      kind = "fertile";
    else if (within(date, prediction.nextStart, prediction.nextEnd))
      kind = "predicted";
    return { date, kind };
  });
  return {
    startDate: last.startDate,
    days,
    todayIndex: diffDays(last.startDate, today),
    daysUntilNext: diffDays(today, prediction.nextStart),
    daysUntilOvulation: diffDays(today, prediction.ovulation),
  };
}
