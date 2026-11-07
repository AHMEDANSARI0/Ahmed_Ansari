import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("mobile public site", () => {
  test("hero stacks without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("menu trigger opens the section navigation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("link", { name: /^process$/i }).last()).toBeVisible();
  });

  test("contact form is usable on a small viewport", async ({ page }) => {
    await page.goto("/#contact");
    await expect(page.locator("#message")).toBeVisible();
    const box = await page.locator("#message").boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(200);
  });
});

test.describe("mobile admin", () => {
  test("navigation opens from the mobile trigger", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: /open navigation/i }).click();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
    await page.getByRole("link", { name: "Settings" }).click();
    await page.waitForURL("**/admin/settings");
    await expect(page.getByRole("heading", { name: "General settings" })).toBeVisible();
  });

  test("no horizontal overflow on the dashboard", async ({ page }) => {
    await signIn(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
