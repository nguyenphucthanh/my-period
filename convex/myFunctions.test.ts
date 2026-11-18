/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// `getAuthUserId` resolves the session through the Convex Auth component,
// which convex-test doesn't mount. Stub it to control who the caller is.
const getAuthUserId = vi.hoisted(() => vi.fn());
vi.mock("@convex-dev/auth/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@convex-dev/auth/server")>()),
  getAuthUserId,
}));

const modules = import.meta.glob("./**/*.ts");

describe("authentication guards", () => {
  beforeEach(() => {
    getAuthUserId.mockReset();
  });

  it("addNumber rejects anonymous callers and writes nothing", async () => {
    getAuthUserId.mockResolvedValue(null);
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.myFunctions.addNumber, { value: 7 }),
    ).rejects.toThrow("Not authenticated");

    const rows = await t.run((ctx) => ctx.db.query("numbers").take(10));
    expect(rows).toEqual([]);
  });

  it("addNumber stores the value for a signed-in user", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", {}));
    getAuthUserId.mockResolvedValue(userId);

    await t.mutation(api.myFunctions.addNumber, { value: 7 });

    const rows = await t.run((ctx) => ctx.db.query("numbers").take(10));
    expect(rows.map((r) => r.value)).toEqual([7]);
  });

  it("listNumbers returns no data to anonymous callers", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => ctx.db.insert("numbers", { value: 3 }));
    getAuthUserId.mockResolvedValue(null);

    await expect(
      t.query(api.myFunctions.listNumbers, { count: 10 }),
    ).resolves.toEqual({ viewer: null, numbers: [] });
  });
});
