import {
  addDays,
  diffDays,
  LUTEAL_PHASE,
  MAX_CYCLE,
  type PeriodRange,
  periodLength,
  predict,
} from "./cycle";

export type HistoryDay = "period" | "fertile" | "ovulation" | "none";

export type HistoryCycle = {
  startDate: string;
  /** Last day of the cycle; null while it is still running. */
  endDate: string | null;
  /** Days of the cycle (elapsed days while ongoing). */
  length: number;
  periodDays: number;
  ongoing: boolean;
  /** One entry per day dot. */
  days: HistoryDay[];
};

/** Years to pick from: current year back to the first logged year. */
export function selectableYears(
  firstYear: number | null,
  currentYear: number,
): number[] {
  const first =
    firstYear === null || firstYear > currentYear ? currentYear : firstYear;
  return Array.from(
    { length: currentYear - first + 1 },
    (_, i) => currentYear - i,
  );
}

function dayKinds(
  total: number,
  periodDays: number,
  marks: boolean,
): HistoryDay[] {
  const ovulation = total - LUTEAL_PHASE;
  return Array.from({ length: total }, (_, i) => {
    if (i < periodDays) return "period";
    if (!marks) return "none";
    if (i === ovulation) return "ovulation";
    if (i >= ovulation - 5 && i <= ovulation + 1) return "fertile";
    return "none";
  });
}

/**
 * Cycles that start in `year`, oldest first. `periods` may include periods
 * outside the year: the next one closes the year's last cycle.
 */
export function buildHistory(
  periods: readonly PeriodRange[],
  year: number,
  today: string,
): HistoryCycle[] {
  const sorted = [...periods].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const predicted = predict(sorted)?.cycleLength ?? 0;
  const cycles: HistoryCycle[] = [];
  sorted.forEach((period, i) => {
    if (!period.startDate.startsWith(`${year}-`)) return;
    const next = sorted[i + 1];
    const periodDays = periodLength(period);
    const ongoing = !next;
    const length = next
      ? diffDays(period.startDate, next.startDate)
      : Math.max(1, diffDays(period.startDate, today) + 1);
    const total = ongoing ? Math.max(length, predicted) : length;
    cycles.push({
      startDate: period.startDate,
      endDate: next ? addDays(next.startDate, -1) : null,
      length,
      periodDays,
      ongoing,
      days: dayKinds(total, periodDays, total <= MAX_CYCLE),
    });
  });
  return cycles;
}
