/**
 * Pure statistics for the cycle-analysis page. Inputs may be in any order;
 * outputs are oldest first so charts read left to right.
 */
import {
  afterCutoff,
  diffDays,
  MAX_CYCLE,
  MAX_RECENT_PERIODS,
  MIN_CYCLE,
  type PeriodRange,
  periodLength,
  predict,
} from "./cycle";

export const NORMAL_CYCLE_RANGE = { min: 21, max: 35 } as const;
export const NORMAL_PERIOD_RANGE = { min: 2, max: 7 } as const;

export type Classification = "normal" | "abnormal" | "unknown";

/** Gaps between consecutive period starts (latest 6 cycles). */
export function cycleLengths(
  periods: readonly PeriodRange[],
  since?: string,
): number[] {
  const sorted = afterCutoff(periods, since);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = diffDays(sorted[i - 1].startDate, sorted[i].startDate);
    if (gap >= MIN_CYCLE && gap <= MAX_CYCLE) gaps.push(gap);
  }
  return gaps.slice(-MAX_RECENT_PERIODS);
}

/** Bleeding days of the latest 6 periods. */
export function periodLengths(
  periods: readonly PeriodRange[],
  since?: string,
): number[] {
  return afterCutoff(periods, since)
    .slice(-MAX_RECENT_PERIODS)
    .map(periodLength);
}

export function rangeOf(
  values: readonly number[],
): { min: number; max: number } | null {
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Change between the last two values (latest minus previous). */
export function variation(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  return values[values.length - 1] - values[values.length - 2];
}

function classify(
  values: readonly number[],
  range: { min: number; max: number },
): Classification {
  if (values.length === 0) return "unknown";
  return values.every((v) => v >= range.min && v <= range.max)
    ? "normal"
    : "abnormal";
}

export const classifyCycleLength = (values: readonly number[]) =>
  classify(values, NORMAL_CYCLE_RANGE);

export const classifyPeriodLength = (values: readonly number[]) =>
  classify(values, NORMAL_PERIOD_RANGE);

export type PeriodStatus =
  | { kind: "upcoming"; days: number }
  | { kind: "on-time" }
  | { kind: "late"; days: number }
  | { kind: "unknown" };

/** Where the current cycle stands against the predicted next start. */
export function currentPeriodStatus(
  periods: readonly PeriodRange[],
  today: string,
  since?: string,
): PeriodStatus {
  const prediction = predict(periods, since);
  if (!prediction) return { kind: "unknown" };
  const days = diffDays(today, prediction.nextStart);
  if (days > 0) return { kind: "upcoming", days };
  if (days === 0) return { kind: "on-time" };
  return { kind: "late", days: -days };
}
