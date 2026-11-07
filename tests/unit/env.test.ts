import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/env";

describe("environment parsing", () => {
  it("treats empty strings as missing optional values", () => {
    const env = parseServerEnv({ SESSION_SECRET: "", DATABASE_URL: "", STORAGE_DRIVER: "" });
    expect(env.SESSION_SECRET).toBeUndefined();
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.STORAGE_DRIVER).toBe("local");
  });

  it("keeps a configured secret", () => {
    const env = parseServerEnv({ SESSION_SECRET: "0123456789abcdef0123456789abcdef" });
    expect(env.SESSION_SECRET).toHaveLength(32);
  });

  it("rejects a secret that is too short", () => {
    expect(() => parseServerEnv({ SESSION_SECRET: "short" })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it("rejects an invalid AI base url", () => {
    expect(() => parseServerEnv({ AI_BASE_URL: "not-a-url" })).toThrow(/AI_BASE_URL/);
  });

  it("rejects an unknown storage driver", () => {
    expect(() => parseServerEnv({ STORAGE_DRIVER: "s3" })).toThrow(/STORAGE_DRIVER/);
  });

  it("defaults the public site url", () => {
    expect(parseServerEnv({}).NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });
});
