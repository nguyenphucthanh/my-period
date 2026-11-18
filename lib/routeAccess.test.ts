import { describe, expect, it } from "vitest";
import { getRedirectPath, isPublicPath } from "./routeAccess";

describe("isPublicPath", () => {
  it("only treats the sign-in page as public", () => {
    expect(isPublicPath("/signin")).toBe(true);
    expect(isPublicPath("/signin/")).toBe(true);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/server")).toBe(false);
    expect(isPublicPath("/signin/extra")).toBe(false);
    expect(isPublicPath("/SIGNIN")).toBe(false);
  });
});

describe("getRedirectPath", () => {
  it("sends signed-out users to sign-in from any non-public route", () => {
    for (const path of ["/", "/server", "/anything/new", "/a/b/c"]) {
      expect(getRedirectPath(path, false)).toBe("/signin");
    }
  });

  it("lets signed-out users see the sign-in page", () => {
    expect(getRedirectPath("/signin", false)).toBeNull();
  });

  it("bounces signed-in users off the sign-in page", () => {
    expect(getRedirectPath("/signin", true)).toBe("/");
  });

  it("lets signed-in users through everywhere else", () => {
    for (const path of ["/", "/server", "/anything/new"]) {
      expect(getRedirectPath(path, true)).toBeNull();
    }
  });
});
