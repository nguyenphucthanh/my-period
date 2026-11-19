/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("pregnancies", () => {
  beforeEach(() => {
    getAuthUserId.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-19T05:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("rejects anonymous callers", async () => {
    getAuthUserId.mockResolvedValue(null);
    const t = convexTest(schema, modules);
    await expect(t.query(api.pregnancies.current, {})).rejects.toThrow(
      "Not authenticated",
    );
    await expect(
      t.mutation(api.pregnancies.start, { startDate: "2026-11-01" }),
    ).rejects.toThrow("Not authenticated");
    await expect(
      t.mutation(api.pregnancies.end, { endDate: "2026-11-10" }),
    ).rejects.toThrow("Not authenticated");
  });

  it("has no current pregnancy by default", async () => {
    const { t } = await setup();
    expect(await t.query(api.pregnancies.current, {})).toBeNull();
  });

  it("starts a pregnancy and returns it as current", async () => {
    const { t } = await setup();
    await t.mutation(api.pregnancies.start, { startDate: "2026-11-01" });
    const current = await t.query(api.pregnancies.current, {});
    expect(current).toMatchObject({ startDate: "2026-11-01" });
    expect(current?.endDate).toBeUndefined();
  });

  it("rejects starting a second open pregnancy", async () => {
    const { t } = await setup();
    await t.mutation(api.pregnancies.start, { startDate: "2026-11-01" });
    await expect(
      t.mutation(api.pregnancies.start, { startDate: "2026-11-05" }),
    ).rejects.toThrow("Pregnancy already in progress");
  });

  it("rejects invalid and future start dates", async () => {
    const { t } = await setup();
    await expect(
      t.mutation(api.pregnancies.start, { startDate: "2026-02-30" }),
    ).rejects.toThrow("Invalid date");
    await expect(
      t.mutation(api.pregnancies.start, { startDate: "2026-11-25" }),
    ).rejects.toThrow("Date is in the future");
  });

  it("isolates pregnancies between users", async () => {
    const { t, otherId } = await setup();
    await t.run((ctx) =>
      ctx.db.insert("pregnancies", { userId: otherId, startDate: "2026-10-01" }),
    );
    expect(await t.query(api.pregnancies.current, {})).toBeNull();
    await t.mutation(api.pregnancies.start, { startDate: "2026-11-01" });
  });

  it("ends the open pregnancy and keeps it as the latest record", async () => {
    const { t } = await setup();
    await t.mutation(api.pregnancies.start, { startDate: "2026-09-01" });
    await t.mutation(api.pregnancies.end, { endDate: "2026-11-10" });
    expect(await t.query(api.pregnancies.current, {})).toMatchObject({
      startDate: "2026-09-01",
      endDate: "2026-11-10",
    });
    // a new pregnancy can start after the previous one ended
    await t.mutation(api.pregnancies.start, { startDate: "2026-11-15" });
    expect(await t.query(api.pregnancies.current, {})).toMatchObject({
      startDate: "2026-11-15",
    });
  });

  it("rejects ending with no open pregnancy", async () => {
    const { t } = await setup();
    await expect(
      t.mutation(api.pregnancies.end, { endDate: "2026-11-10" }),
    ).rejects.toThrow("No pregnancy in progress");
  });

  it("rejects bad end dates", async () => {
    const { t } = await setup();
    await t.mutation(api.pregnancies.start, { startDate: "2026-11-01" });
    await expect(
      t.mutation(api.pregnancies.end, { endDate: "nope" }),
    ).rejects.toThrow("Invalid date");
    await expect(
      t.mutation(api.pregnancies.end, { endDate: "2026-10-31" }),
    ).rejects.toThrow("End date is before start date");
    await expect(
      t.mutation(api.pregnancies.end, { endDate: "2026-11-25" }),
    ).rejects.toThrow("Date is in the future");
  });

  it("does not end another user's pregnancy", async () => {
    const { t, otherId } = await setup();
    await t.run((ctx) =>
      ctx.db.insert("pregnancies", { userId: otherId, startDate: "2026-10-01" }),
    );
    await expect(
      t.mutation(api.pregnancies.end, { endDate: "2026-11-10" }),
    ).rejects.toThrow("No pregnancy in progress");
  });

  it("rejects a new pregnancy that starts on or before the previous end", async () => {
    const { t } = await setup();
    await t.mutation(api.pregnancies.start, { startDate: "2026-09-01" });
    await t.mutation(api.pregnancies.end, { endDate: "2026-11-10" });
    await expect(
      t.mutation(api.pregnancies.start, { startDate: "2026-11-10" }),
    ).rejects.toThrow("Pregnancy overlaps an existing one");
  });

  it("removes the open pregnancy so a wrong start date can be redone", async () => {
    const { t } = await setup();
    await t.mutation(api.pregnancies.start, { startDate: "2026-11-01" });
    await t.mutation(api.pregnancies.remove, {});
    expect(await t.query(api.pregnancies.current, {})).toBeNull();
    await t.mutation(api.pregnancies.start, { startDate: "2026-10-20" });
    expect(await t.query(api.pregnancies.current, {})).toMatchObject({
      startDate: "2026-10-20",
    });
  });

  it("does not remove an ended pregnancy or another user's", async () => {
    const { t, otherId } = await setup();
    await expect(t.mutation(api.pregnancies.remove, {})).rejects.toThrow(
      "No pregnancy in progress",
    );
    await t.run((ctx) =>
      ctx.db.insert("pregnancies", { userId: otherId, startDate: "2026-10-01" }),
    );
    await expect(t.mutation(api.pregnancies.remove, {})).rejects.toThrow(
      "No pregnancy in progress",
    );
    await t.mutation(api.pregnancies.start, { startDate: "2026-09-01" });
    await t.mutation(api.pregnancies.end, { endDate: "2026-11-10" });
    await expect(t.mutation(api.pregnancies.remove, {})).rejects.toThrow(
      "No pregnancy in progress",
    );
  });
});
