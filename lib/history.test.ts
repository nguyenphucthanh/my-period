import { describe, expect, it } from "vitest";
import { buildHistory, selectableYears } from "./history";

const p = (startDate: string, endDate: string) => ({ startDate, endDate });

describe("selectableYears", () => {
  it("lists years from current back to the first logged, never future", () => {
    expect(selectableYears(2024, 2026)).toEqual([2026, 2025, 2024]);
  });
  it("falls back to the current year without data", () => {
    expect(selectableYears(null, 2026)).toEqual([2026]);
  });
  it("ignores a first year in the future", () => {
    expect(selectableYears(2030, 2026)).toEqual([2026]);
  });
});

describe("buildHistory", () => {
  const periods = [
    p("2026-01-01", "2026-01-05"), // 5 days, cycle 30
    p("2026-01-31", "2026-02-06"), // 7 days, cycle 28
    p("2026-02-28", "2026-03-04"), // latest, ongoing
  ];

  it("builds oldest-first cycles for the requested year only", () => {
    const h = buildHistory(periods, 2026, "2026-03-10");
    expect(h.map((c) => c.startDate)).toEqual([
      "2026-01-01",
      "2026-01-31",
      "2026-02-28",
    ]);
    expect(h[0]).toMatchObject({
      length: 30,
      periodDays: 5,
      ongoing: false,
      endDate: "2026-01-30",
    });
    expect(h[1]).toMatchObject({ length: 28, periodDays: 7, ongoing: false });
  });

  it("marks the last period as ongoing with elapsed days", () => {
    const last = buildHistory(periods, 2026, "2026-03-10").at(-1)!;
    expect(last).toMatchObject({
      ongoing: true,
      endDate: null,
      length: 11,
      periodDays: 5,
    });
  });

  it("dots: period, then ovulation 14 days before the next start, fertile window around it", () => {
    const [c] = buildHistory(periods, 2026, "2026-03-10");
    expect(c.days).toHaveLength(30);
    expect(c.days.slice(0, 5)).toEqual(Array(5).fill("period"));
    // ovulation index = 30 - 14 = 16; fertile = 11..17
    expect(c.days[16]).toBe("ovulation");
    expect(c.days.slice(11, 16)).toEqual(Array(5).fill("fertile"));
    expect(c.days[17]).toBe("fertile");
    expect(c.days[18]).toBe("none");
    expect(c.days[10]).toBe("none");
  });

  it("period days win over the fertile window in short cycles", () => {
    const short = [
      p("2026-01-01", "2026-01-07"),
      p("2026-01-20", "2026-01-22"),
    ];
    const [c] = buildHistory(short, 2026, "2026-02-01");
    expect(c.days.slice(0, 7).every((d) => d === "period")).toBe(true);
  });

  it("ongoing cycle dots cover at least the predicted cycle length", () => {
    const last = buildHistory(periods, 2026, "2026-03-10").at(-1)!;
    expect(last.days.length).toBeGreaterThanOrEqual(28);
    expect(last.days.filter((d) => d === "ovulation")).toHaveLength(1);
  });

  it("skips fertile marks for implausibly long gaps", () => {
    const gap = [p("2026-01-01", "2026-01-05"), p("2026-05-01", "2026-05-05")];
    const [c] = buildHistory(gap, 2026, "2026-06-01");
    expect(c.length).toBe(120);
    expect(c.days.some((d) => d === "ovulation" || d === "fertile")).toBe(
      false,
    );
  });

  it("uses the following-year period to close the last cycle of a past year", () => {
    const h = buildHistory(
      [p("2026-12-20", "2026-12-24"), p("2027-01-18", "2027-01-22")],
      2026,
      "2027-02-01",
    );
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ length: 29, ongoing: false });
  });

  it("returns nothing for a year without periods", () => {
    expect(buildHistory(periods, 2025, "2026-03-10")).toEqual([]);
    expect(buildHistory([], 2026, "2026-03-10")).toEqual([]);
  });
});
