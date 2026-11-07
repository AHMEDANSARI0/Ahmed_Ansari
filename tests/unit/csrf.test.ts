import { describe, expect, it } from "vitest";
import { createCsrfToken, verifyCsrfToken } from "@/lib/security/csrf";

describe("csrf token", () => {
  it("accepts a token it created", () => {
    expect(verifyCsrfToken(createCsrfToken())).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const token = createCsrfToken();
    expect(verifyCsrfToken(`${token.slice(0, -3)}abc`)).toBe(false);
  });

  it("rejects a tampered expiry", () => {
    const [id, , signature] = createCsrfToken().split(".");
    expect(verifyCsrfToken(`${id}.9999999999999.${signature}`)).toBe(false);
  });

  it("rejects malformed and empty input", () => {
    expect(verifyCsrfToken(undefined)).toBe(false);
    expect(verifyCsrfToken("")).toBe(false);
    expect(verifyCsrfToken("a.b")).toBe(false);
    expect(verifyCsrfToken("a.b.c.d")).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = createCsrfToken();
    const [id, , signature] = token.split(".");
    expect(verifyCsrfToken(`${id}.${Date.now() - 1000}.${signature}`)).toBe(false);
  });
});
