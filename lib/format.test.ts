import { describe, expect, it } from "vitest";
import {
  anomalyText,
  cycleSummaryText,
  periodStatusText,
  periodSummaryText,
  rangeText,
  variationText,
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

describe("analysis texts", () => {
  it("rangeText collapses equal bounds", () => {
    expect(rangeText({ min: 29, max: 32 })).toBe("29–32");
    expect(rangeText({ min: 7, max: 7 })).toBe("7");
  });
  it("variationText signs the value", () => {
    expect(variationText(1)).toBe("+1 ngày");
    expect(variationText(-2)).toBe("-2 ngày");
    expect(variationText(0)).toBe("0 ngày");
  });
  it("summaries mention counts and averages", () => {
    expect(cycleSummaryText(5, 31)).toContain("5 chu kỳ");
    expect(cycleSummaryText(5, 31)).toContain("31 ngày");
    expect(periodSummaryText(6, 7, true)).not.toContain("bác sĩ");
    expect(periodSummaryText(6, 7, false)).toContain("bác sĩ");
  });
  it("periodStatusText covers every status", () => {
    expect(periodStatusText({ kind: "upcoming", days: 6 })).toBe("Còn 6 ngày");
    expect(periodStatusText({ kind: "on-time" })).toBe("Đúng hạn");
    expect(periodStatusText({ kind: "late", days: 3 })).toBe("Trễ 3 ngày");
    expect(periodStatusText({ kind: "unknown" })).toBe("Chưa có dữ liệu");
  });
});
