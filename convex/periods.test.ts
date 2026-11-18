/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const getAuthUserId = vi.hoisted(() => vi.fn());
vi.mock("@convex-dev/auth/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@convex-dev/auth/server")>()),
  getAuthUserId,
}));

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", {}));
  const otherId = await t.run((ctx) => ctx.db.insert("users", {}));
  getAuthUserId.mockResolvedValue(userId);
  return { t, userId, otherId };
}

describe("periods", () => {
  beforeEach(() => getAuthUserId.mockReset());

  it("rejects anonymous callers", async () => {
    getAuthUserId.mockResolvedValue(null);
    const t = convexTest(schema, modules);
    await expect(t.query(api.periods.list, {})).rejects.toThrow("Not authenticated");
    await expect(
      t.mutation(api.periods.log, { startDate: "2026-11-01", endDate: "2026-11-05" }),
    ).rejects.toThrow("Not authenticated");
  });

  it("logs and lists newest first, only for the caller", async () => {
    const { t, otherId } = await setup();
    await t.run((ctx) =>
      ctx.db.insert("periods", {
        userId: otherId,
        startDate: "2026-11-20",
        endDate: "2026-11-22",
      }),
    );
    await t.mutation(api.periods.log, { startDate: "2026-10-01", endDate: "2026-10-05" });
    await t.mutation(api.periods.log, { startDate: "2026-11-01", endDate: "2026-11-05" });
    const rows = await t.query(api.periods.list, {});
    expect(rows.map((r) => r.startDate)).toEqual(["2026-11-01", "2026-10-01"]);
  });

  it("lists only the 6 latest periods", async () => {
    const { t } = await setup();
    for (let m = 1; m <= 8; m++) {
      const mm = String(m).padStart(2, "0");
      await t.mutation(api.periods.log, {
        startDate: `2026-${mm}-01`,
        endDate: `2026-${mm}-05`,
      });
    }
    const rows = await t.query(api.periods.list, {});
    expect(rows.map((r) => r.startDate)).toEqual([
      "2026-08-01",
      "2026-07-01",
      "2026-06-01",
      "2026-05-01",
      "2026-04-01",
      "2026-03-01",
    ]);
  });

  it("rejects invalid input", async () => {
    const { t } = await setup();
    await expect(
      t.mutation(api.periods.log, { startDate: "2026-11-05", endDate: "2026-11-01" }),
    ).rejects.toThrow("End date is before start date");
    await expect(
      t.mutation(api.periods.log, { startDate: "2026-02-30", endDate: "2026-03-02" }),
    ).rejects.toThrow("Invalid date");
    await expect(
      t.mutation(api.periods.log, { startDate: "nope", endDate: "2026-03-02" }),
    ).rejects.toThrow("Invalid date");
    await expect(
      t.mutation(api.periods.log, { startDate: "2026-01-01", endDate: "2026-03-01" }),
    ).rejects.toThrow("Period is too long");
  });

  it("rejects overlaps, including a new range that spans an old one", async () => {
    const { t } = await setup();
    await t.mutation(api.periods.log, { startDate: "2026-11-10", endDate: "2026-11-14" });
    for (const [s, e] of [
      ["2026-11-12", "2026-11-16"],
      ["2026-11-06", "2026-11-10"],
      ["2026-11-05", "2026-11-20"],
      ["2026-11-14", "2026-11-14"],
    ]) {
      await expect(
        t.mutation(api.periods.log, { startDate: s, endDate: e }),
      ).rejects.toThrow("overlaps");
    }
    // adjacent is fine
    await t.mutation(api.periods.log, { startDate: "2026-11-15", endDate: "2026-11-17" });
    await t.mutation(api.periods.log, { startDate: "2026-11-06", endDate: "2026-11-09" });
  });

  it("updates a period, allowing it to overlap its own old range", async () => {
    const { t } = await setup();
    const id = await t.mutation(api.periods.log, {
      startDate: "2026-11-10",
      endDate: "2026-11-14",
    });
    await t.mutation(api.periods.update, {
      id,
      startDate: "2026-11-09",
      endDate: "2026-11-16",
    });
    const [row] = await t.query(api.periods.list, {});
    expect([row.startDate, row.endDate]).toEqual(["2026-11-09", "2026-11-16"]);
  });

  it("update still rejects overlap with another period", async () => {
    const { t } = await setup();
    await t.mutation(api.periods.log, { startDate: "2026-10-01", endDate: "2026-10-05" });
    const id = await t.mutation(api.periods.log, {
      startDate: "2026-11-01",
      endDate: "2026-11-05",
    });
    await expect(
      t.mutation(api.periods.update, { id, startDate: "2026-10-04", endDate: "2026-10-08" }),
    ).rejects.toThrow("overlaps");
  });

  it("removes a period", async () => {
    const { t } = await setup();
    const id = await t.mutation(api.periods.log, {
      startDate: "2026-11-10",
      endDate: "2026-11-14",
    });
    await t.mutation(api.periods.remove, { id });
    expect(await t.query(api.periods.list, {})).toEqual([]);
  });

  it("cannot update or remove another user's period", async () => {
    const { t, otherId } = await setup();
    const id = await t.run((ctx) =>
      ctx.db.insert("periods", {
        userId: otherId,
        startDate: "2026-11-01",
        endDate: "2026-11-05",
      }),
    );
    await expect(
      t.mutation(api.periods.update, { id, startDate: "2026-11-02", endDate: "2026-11-06" }),
    ).rejects.toThrow("Period not found");
    await expect(t.mutation(api.periods.remove, { id })).rejects.toThrow("Period not found");
    const row = await t.run((ctx) => ctx.db.get("periods", id));
    expect(row?.startDate).toBe("2026-11-01");
  });
});
