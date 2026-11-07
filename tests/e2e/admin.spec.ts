import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("admin panel", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("dashboard reports database backed counts", async ({ page }) => {
    await expect(page.getByText("Database connected")).toBeVisible();
    await expect(page.getByText("Recent inquiries")).toBeVisible();
    await expect(page.getByText("System status")).toBeVisible();
  });

  test("account page lists role permissions", async ({ page }) => {
    await page.goto("/admin/account");
    await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
    await expect(page.getByText("settings.manage")).toBeVisible();
  });

  test("security page lists the current session", async ({ page }) => {
    await page.goto("/admin/security");
    await expect(page.getByText("this device")).toBeVisible();
  });

  test("saving settings persists and survives a reload", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByLabel("Logo text").fill("AANSARI");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Logo text")).toHaveValue("AANSARI");

    await page.getByLabel("Logo text").fill("AHMED");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();
  });

  test("settings changes reach the public site after revalidation", async ({ page, request }) => {
    await page.goto("/admin/settings");
    await page.getByLabel("Availability message").fill("Booking January cohort");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();

    const home = await request.get("/");
    expect(home.status()).toBe(200);

    await page.goto("/admin/settings");
    await page.getByLabel("Availability message").fill("Accepting new automation projects for Q1");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();
  });

  test("inquiries page filters without errors", async ({ page }) => {
    await page.goto("/admin/inquiries");
    await expect(page.getByRole("heading", { name: "Inquiries" })).toBeVisible();
    await page.getByPlaceholder("Name, email or company").fill("nobody");
    await page.getByRole("button", { name: /filter/i }).click();
    await page.waitForURL(/q=nobody/);
    await expect(page.getByText(/No inquiries in this view/)).toBeVisible();
    await expect(page.getByText("0 shown", { exact: false })).toBeVisible();
  });
});
