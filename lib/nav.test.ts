import { describe, expect, it } from "vitest";
import { isActiveNav, NAV_ITEMS } from "./nav";

describe("NAV_ITEMS", () => {
  it("lists Home first, then cycle analysis", () => {
    expect(NAV_ITEMS.map((i) => i.href)).toEqual(["/", "/cycle-analysis"]);
  });
});

describe("isActiveNav", () => {
  it("matches home only on exact /", () => {
    expect(isActiveNav("/", "/")).toBe(true);
    expect(isActiveNav("/", "/cycle-analysis")).toBe(false);
  });
  it("matches nested routes by prefix", () => {
    expect(isActiveNav("/cycle-analysis", "/cycle-analysis")).toBe(true);
    expect(isActiveNav("/cycle-analysis", "/cycle-analysis/x")).toBe(true);
    expect(isActiveNav("/cycle-analysis", "/cycle-analysisx")).toBe(false);
  });
});
