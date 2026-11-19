import { describe, expect, it } from "vitest";
import {
  average,
  classifyCycleLength,
  classifyPeriodLength,
  currentPeriodStatus,
  cycleLengths,
  periodLengths,
  rangeOf,
  variation,
} from "./analysis";

const p = (startDate: string, endDate: string) => ({ startDate, endDate });

// Passed newest-first, like the Convex query returns them.
const periods = [
  p("2026-09-01", "2026-09-06"), // 6 days
  p("2026-08-02", "2026-08-08"), // 7 days
  p("2026-07-03", "2026-07-07"), // 5 days
];

describe("cycleLengths", () => {
  it("returns gaps between starts, oldest first", () => {
    expect(cycleLengths(periods)).toEqual([30, 30]);
  });
  it("is empty with fewer than 2 periods", () => {
    expect(cycleLengths([])).toEqual([]);
    expect(cycleLengths([periods[0]])).toEqual([]);
  });
  it("skips gaps outside the plausible range", () => {
    const gappy = [
      p("2026-09-01", "2026-09-05"),
      p("2026-05-01", "2026-05-05"),
    ];
    expect(cycleLengths(gappy)).toEqual([]);
  });
  it("ignores periods on or before the pregnancy cutoff", () => {
    expect(cycleLengths(periods, "2026-07-31")).toEqual([30]);
  });
  it("keeps at most the 6 latest cycles", () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      p(
        `2026-${String(i + 1).padStart(2, "0")}-01`,
        `2026-${String(i + 1).padStart(2, "0")}-05`,
      ),
    );
    expect(cycleLengths(many)).toHaveLength(6);
  });
});

describe("periodLengths", () => {
  it("returns inclusive day counts, oldest first", () => {
    expect(periodLengths(periods)).toEqual([5, 7, 6]);
  });
  it("keeps at most 6 and honours the cutoff", () => {
    expect(periodLengths(periods, "2026-07-31")).toEqual([7, 6]);
    const many = Array.from({ length: 8 }, (_, i) =>
      p(`2026-0${i + 1}-01`, `2026-0${i + 1}-03`),
    );
    expect(periodLengths(many)).toHaveLength(6);
  });
  it("is empty for no periods", () => {
    expect(periodLengths([])).toEqual([]);
  });
});

describe("stats", () => {
  it("rangeOf gives min and max", () => {
    expect(rangeOf([31, 29, 32])).toEqual({ min: 29, max: 32 });
    expect(rangeOf([])).toBeNull();
  });
  it("average rounds", () => {
    expect(average([31, 30])).toBe(31);
    expect(average([29, 30, 30])).toBe(30);
    expect(average([])).toBeNull();
  });
  it("variation compares the last two values", () => {
    expect(variation([30, 31])).toBe(1);
    expect(variation([31, 30])).toBe(-1);
    expect(variation([7, 7])).toBe(0);
    expect(variation([7])).toBeNull();
  });
});

describe("classification", () => {
  it("cycle 21-35 is normal, inclusive", () => {
    expect(classifyCycleLength([21, 35])).toBe("normal");
    expect(classifyCycleLength([20, 30])).toBe("abnormal");
    expect(classifyCycleLength([30, 36])).toBe("abnormal");
  });
  it("period 2-7 is normal, inclusive", () => {
    expect(classifyPeriodLength([2, 7])).toBe("normal");
    expect(classifyPeriodLength([1, 5])).toBe("abnormal");
    expect(classifyPeriodLength([6, 8])).toBe("abnormal");
  });
  it("empty is unknown", () => {
    expect(classifyCycleLength([])).toBe("unknown");
    expect(classifyPeriodLength([])).toBe("unknown");
  });
});

describe("currentPeriodStatus", () => {
  // last start 2026-09-01, avg cycle 30 -> next 2026-10-01
  it("upcoming before the predicted date", () => {
    expect(currentPeriodStatus(periods, "2026-09-25")).toEqual({
      kind: "upcoming",
      days: 6,
    });
  });
  it("on time on the predicted date", () => {
    expect(currentPeriodStatus(periods, "2026-10-01")).toEqual({
      kind: "on-time",
    });
  });
  it("late after it", () => {
    expect(currentPeriodStatus(periods, "2026-10-04")).toEqual({
      kind: "late",
      days: 3,
    });
  });
  it("unknown without periods", () => {
    expect(currentPeriodStatus([], "2026-10-04")).toEqual({ kind: "unknown" });
  });
});
