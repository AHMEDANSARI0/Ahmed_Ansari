import type { Page } from "@playwright/test";
import { clearThrottle } from "./reset";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@local.dev";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "DevSetup#2026aa";

export async function signIn(page: Page, next = "/admin/dashboard") {
  await clearThrottle(ADMIN_EMAIL);
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(`**${next}`, { timeout: 20_000 });
}
