import { describe, expect, it } from "vitest";
import { nextPeriodCountdown, ovulationText } from "./format";

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
