import { describe, expect, it } from "vitest";
import { validatePasswordStrength } from "@/lib/auth/session";
import { loginSchema, slugSchema, changePasswordSchema } from "@/lib/validations/shared";

describe("password policy", () => {
  it("accepts a compliant password", () => {
    expect(validatePasswordStrength("StrongPass#2026")).toEqual([]);
  });

  it("reports every missing requirement", () => {
    expect(validatePasswordStrength("short")).toHaveLength(3);
  });

  it("requires a symbol and a number", () => {
    expect(validatePasswordStrength("alllettersnonumber")).toHaveLength(2);
    expect(validatePasswordStrength("allletters123456")).toHaveLength(1);
  });
});

describe("login schema", () => {
  it("normalises and accepts a valid payload", () => {
    const parsed = loginSchema.parse({ email: "  admin@local.dev ", password: "x" });
    expect(parsed.email).toBe("admin@local.dev");
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});

describe("slug schema", () => {
  it("accepts kebab case", () => {
    expect(slugSchema.safeParse("omni-flow-2").success).toBe(true);
  });

  it("rejects spaces and capitals", () => {
    expect(slugSchema.safeParse("Omni Flow").success).toBe(false);
  });
});

describe("change password schema", () => {
  it("rejects mismatched confirmation", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-password-1",
      newPassword: "BrandNew#2026x",
      confirmPassword: "BrandNew#2026y",
    });
    expect(result.success).toBe(false);
  });
});
