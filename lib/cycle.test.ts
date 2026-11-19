import { describe, expect, it } from "vitest";
import {
  addDays,
  buildBar,
  detectAnomalies,
  diffDays,
  periodLength,
  predict,
  suggestedPeriodLength,
  toIsoDate,
  toLocalDate,
} from "./cycle";

const p = (startDate: string, endDate: string) => ({ startDate, endDate });

describe("date helpers", () => {
  it("adds and diffs days across month, year and DST boundaries", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-10", -10)).toBe("2026-02-28");
    expect(diffDays("2026-03-01", "2026-04-01")).toBe(31);
    expect(diffDays("2026-10-01", "2026-11-05")).toBe(35);
  });

  it("round-trips local dates", () => {
    expect(toIsoDate(toLocalDate("2026-11-05"))).toBe("2026-11-05");
  });

  it("counts inclusive period length", () => {
    expect(periodLength(p("2026-11-01", "2026-11-01"))).toBe(1);
    expect(periodLength(p("2026-11-01", "2026-11-08"))).toBe(8);
  });
});

describe("predict", () => {
  it("returns null without periods", () => {
    expect(predict([])).toBeNull();
    expect(buildBar([], "2026-11-18")).toBeNull();
  });

  it("uses defaults for a single period but keeps its length", () => {
    const r = predict([p("2026-11-01", "2026-11-07")])!;
    expect(r.cycleLength).toBe(28);
    expect(r.periodLength).toBe(7);
    expect(r.nextStart).toBe("2026-11-29");
    expect(r.nextEnd).toBe("2026-12-05");
  });

  it("averages gaps and lengths, regardless of input order", () => {
    const r = predict([
      p("2026-11-01", "2026-11-05"),
      p("2026-09-03", "2026-09-07"),
      p("2026-10-02", "2026-10-07"),
    ])!;
    // gaps: 29, 30 -> 29.5 rounds to 30; lengths 5,6,5 -> 5
    expect(r.cycleLength).toBe(30);
    expect(r.periodLength).toBe(5);
    expect(r.lastStart).toBe("2026-11-01");
    expect(r.nextStart).toBe("2026-12-01");
  });

  it("places ovulation 14 days before next period with a 7-day window", () => {
    const r = predict([p("2026-10-04", "2026-10-08"), p("2026-11-01", "2026-11-05")])!;
    expect(r.cycleLength).toBe(28);
    expect(r.ovulation).toBe("2026-11-15");
    expect(r.fertileStart).toBe("2026-11-10");
    expect(r.fertileEnd).toBe("2026-11-16");
  });

  it("only uses the latest 6 periods", () => {
    const old = p("2025-01-01", "2025-01-05");
    const recent = [
      "2026-01-01",
      "2026-01-31",
      "2026-03-02",
      "2026-04-01",
      "2026-05-01",
      "2026-05-31",
    ].map((s) => p(s, addDays(s, 4)));
    expect(predict([old, ...recent])!.cycleLength).toBe(30);
  });

  it("ignores outlier gaps from missed logs", () => {
    const r = predict([
      p("2026-01-01", "2026-01-05"),
      p("2026-01-29", "2026-02-02"), // 28
      p("2026-05-01", "2026-05-05"), // 92 -> ignored
    ])!;
    expect(r.cycleLength).toBe(28);
  });
});

describe("suggestedPeriodLength", () => {
  it("defaults to 5 and follows history", () => {
    expect(suggestedPeriodLength([])).toBe(5);
    expect(suggestedPeriodLength([p("2026-11-01", "2026-11-08")])).toBe(8);
  });
});

describe("buildBar", () => {
  const periods = [p("2026-10-04", "2026-10-08"), p("2026-11-01", "2026-11-08")];

  it("builds a 45-day bar starting at the last period start", () => {
    const bar = buildBar(periods, "2026-11-10")!;
    expect(bar.startDate).toBe("2026-11-01");
    expect(bar.days).toHaveLength(45);
    expect(bar.todayIndex).toBe(9);
  });

  it("colors period, fertile, peak and predicted days", () => {
    const { days } = buildBar(periods, "2026-11-10")!;
    const kinds = days.map((d) => d.kind);
    // last period: 8 days red
    expect(kinds.slice(0, 8)).toEqual(Array(8).fill("period"));
    // cycle 28, ovulation = Nov 29 - 14 = Nov 15 (index 14)
    expect(days[14].kind).toBe("peak");
    expect(days[9].kind).toBe("fertile"); // Nov 10
    expect(days[15].kind).toBe("fertile"); // Nov 16
    expect(days[16].kind).toBe("none");
    // next period Nov 29 -> index 28, length avg(5,8)=7 -> indices 28..34
    expect(days[27].kind).toBe("none");
    expect(days[28].kind).toBe("predicted");
    expect(days[34].kind).toBe("predicted");
    expect(days[35].kind).toBe("none");
  });

  it("grows past 45 days so a long cycle's predicted period fits", () => {
    const long = [p("2026-01-01", "2026-01-05"), p("2026-02-14", "2026-02-18")];
    const bar = buildBar(long, "2026-02-20")!; // cycle 44 + 5 days = 49
    expect(bar.days).toHaveLength(49);
    expect(bar.days[48].kind).toBe("predicted");
  });

  it("caps the bar at 60 days", () => {
    const huge = [p("2026-01-01", "2026-01-05"), p("2026-03-01", "2026-03-05")];
    // 59-day gap is valid; 59 + 5 = 64 -> capped at 60
    expect(buildBar(huge, "2026-03-02")!.days).toHaveLength(60);
  });

  it("honors an explicit length", () => {
    expect(buildBar(periods, "2026-11-10", 30)!.days).toHaveLength(30);
  });

  it("counts days until the predicted next period", () => {
    // next start Nov 29
    expect(buildBar(periods, "2026-11-18")!.daysUntilNext).toBe(11);
    expect(buildBar(periods, "2026-11-29")!.daysUntilNext).toBe(0);
    expect(buildBar(periods, "2026-12-02")!.daysUntilNext).toBe(-3);
  });

  it("counts days until ovulation, negative once passed", () => {
    // ovulation Nov 15
    expect(buildBar(periods, "2026-11-10")!.daysUntilOvulation).toBe(5);
    expect(buildBar(periods, "2026-11-15")!.daysUntilOvulation).toBe(0);
    expect(buildBar(periods, "2026-11-18")!.daysUntilOvulation).toBe(-3);
  });

  it("reports a today outside the bar", () => {
    expect(buildBar(periods, "2026-12-15")!.todayIndex).toBe(44);
    expect(buildBar(periods, "2026-10-30")!.todayIndex).toBe(-2);
  });
});

describe("detectAnomalies", () => {
  it("returns nothing without periods or with normal cycles", () => {
    expect(detectAnomalies([], "2026-11-18")).toEqual([]);
    expect(
      detectAnomalies(
        [p("2026-09-01", "2026-09-05"), p("2026-09-29", "2026-10-03")],
        "2026-10-10",
      ),
    ).toEqual([]);
  });

  it("flags a gap longer than 60 days between periods", () => {
    expect(
      detectAnomalies(
        [p("2026-01-01", "2026-01-05"), p("2026-04-01", "2026-04-05")],
        "2026-04-10",
      ),
    ).toEqual([
      { kind: "long-gap", from: "2026-01-01", to: "2026-04-01", days: 90 },
    ]);
  });

  it("treats exactly 60 days as normal", () => {
    expect(
      detectAnomalies(
        [p("2026-01-01", "2026-01-05"), p("2026-03-02", "2026-03-06")],
        "2026-03-10",
      ),
    ).toEqual([]);
  });

  it("flags an overdue current cycle", () => {
    expect(
      detectAnomalies([p("2026-09-01", "2026-09-05")], "2026-11-18"),
    ).toEqual([{ kind: "overdue", from: "2026-09-01", days: 78 }]);
    expect(
      detectAnomalies([p("2026-09-01", "2026-09-05")], "2026-10-31"),
    ).toEqual([]);
  });

  it("handles unsorted input and reports both kinds", () => {
    const result = detectAnomalies(
      [p("2026-06-01", "2026-06-05"), p("2026-01-01", "2026-01-05")],
      "2026-11-18",
    );
    expect(result.map((a) => a.kind)).toEqual(["long-gap", "overdue"]);
  });
});

describe("after a pregnancy (since cutoff)", () => {
  // pregnancy ended 2026-08-01; two periods before it, two after it
  const before = [p("2026-01-01", "2026-01-05"), p("2026-01-29", "2026-02-02")];
  const after = [p("2026-08-20", "2026-08-23"), p("2026-09-17", "2026-09-20")];
  const all = [...before, ...after];
  const since = "2026-08-01";

  it("predicts only from periods after the cutoff", () => {
    const result = predict(all, since);
    expect(result).toMatchObject({
      lastStart: "2026-09-17",
      cycleLength: 28,
      periodLength: 4,
      nextStart: "2026-10-15",
    });
  });

  it("returns null when no period was logged after the cutoff", () => {
    expect(predict(before, since)).toBeNull();
    expect(buildBar(before, "2026-08-10", undefined, since)).toBeNull();
  });

  it("does not flag the gap across the pregnancy as an anomaly", () => {
    expect(detectAnomalies(all, "2026-09-25", since)).toEqual([]);
    // without the cutoff the same data is flagged
    expect(detectAnomalies(all, "2026-09-25").map((a) => a.kind)).toEqual([
      "long-gap",
    ]);
  });

  it("does not flag overdue from a period before the cutoff", () => {
    expect(detectAnomalies(before, "2026-08-10", since)).toEqual([]);
  });

  it("still flags a genuinely overdue cycle after the cutoff", () => {
    expect(
      detectAnomalies(all, "2026-12-01", since).map((a) => a.kind),
    ).toEqual(["overdue"]);
  });

  it("builds the bar from the latest period after the cutoff", () => {
    const bar = buildBar(all, "2026-09-20", undefined, since);
    expect(bar?.startDate).toBe("2026-09-17");
  });

  it("treats a period starting exactly on the cutoff day as before it", () => {
    expect(predict([p("2026-08-01", "2026-08-04")], since)).toBeNull();
  });
});
