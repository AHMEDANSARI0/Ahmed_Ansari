import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, signIn } from "./helpers";
import { clearThrottle } from "./reset";

test.describe("admin authentication", () => {
  test.beforeEach(async () => {
    await clearThrottle(ADMIN_EMAIL);
  });

  test("anonymous visitors are redirected to the login screen", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { name: "Admin access" })).toBeVisible();
  });

  test("wrong password shows a safe error message", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("valid credentials establish a session and reach the dashboard", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const cookies = await page.context().cookies();
    const session = cookies.find((cookie) => cookie.name === "aa_session");
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");
  });

  test("signing out revokes access", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL(/\/admin\/login/);
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("session cookie is required for nested admin routes", async ({ page, context }) => {
    await signIn(page);
    await context.clearCookies();
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("password login rejects unknown accounts", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("ghost@example.com");
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });
});
