import { describe, expect, it } from "vitest";
import {
  anomalyText,
  nextPeriodCountdown,
  ovulationText,
  pregnancyProgressText,
} from "./format";

describe("nextPeriodCountdown", () => {
  it("covers future, today and late", () => {
    expect(nextPeriodCountdown(11)).toBe("Còn 11 ngày");
    expect(nextPeriodCountdown(1)).toBe("Còn 1 ngày");
    expect(nextPeriodCountdown(0)).toBe("Hôm nay");
    expect(nextPeriodCountdown(-3)).toBe("Trễ 3 ngày");
  });
});

describe("ovulationText", () => {
  it("covers future, today and passed", () => {
    expect(ovulationText(5)).toBe("Rụng trứng: còn 5 ngày");
    expect(ovulationText(0)).toBe("Rụng trứng: hôm nay");
    expect(ovulationText(-2)).toBe("Rụng trứng: đã qua");
  });
});

describe("anomalyText", () => {
  it("describes a long gap", () => {
    const t = anomalyText({ kind: "long-gap", from: "2026-01-01", to: "2026-04-01", days: 90 });
    expect(t).toContain("90 ngày");
    expect(t).toContain("mang thai");
  });
  it("describes an overdue cycle", () => {
    const t = anomalyText({ kind: "overdue", from: "2026-09-01", days: 78 });
    expect(t).toContain("78 ngày");
    expect(t).toContain("chưa có kỳ mới");
  });
});

describe("pregnancyProgressText", () => {
  it("shows weeks and days since the start date", () => {
    expect(pregnancyProgressText("2026-11-01", "2026-11-01")).toBe("Tuần 0, ngày 0");
    expect(pregnancyProgressText("2026-11-01", "2026-11-07")).toBe("Tuần 0, ngày 6");
    expect(pregnancyProgressText("2026-11-01", "2026-11-08")).toBe("Tuần 1, ngày 0");
    expect(pregnancyProgressText("2026-08-01", "2026-11-19")).toBe("Tuần 15, ngày 5");
  });

  it("clamps a start date that is slightly ahead of today", () => {
    expect(pregnancyProgressText("2026-11-20", "2026-11-19")).toBe("Tuần 0, ngày 0");
  });
});
