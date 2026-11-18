import { describe, expect, it } from "vitest";
import * as authModule from "./auth";

describe("public auth surface", () => {
  it("does not expose a sign-up function", () => {
    const names = Object.keys(authModule);
    expect(names.filter((n) => /sign.?up/i.test(n))).toEqual([]);
    expect(names).toContain("signInWithUsernamePassword");
  });
});
