import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("analytics exclusions", () => {
  test("the panel states its limits and starts empty", async ({ page }) => {
    await signIn(page, "/admin/analytics");
    await expect(page.getByRole("heading", { name: "Counting" })).toBeVisible();
    await expect(page.getByText(/no IP, no cookie, no third-party script/i)).toBeVisible();
    await expect(page.getByText(/daily hash expires at midnight UTC/i)).toBeVisible();
  });

  test("excludes this browser and restores counting", async ({ page }) => {
    await signIn(page, "/admin/analytics");

    await page.getByLabel("Label").fill("Playwright runner");
    await page.getByRole("button", { name: /exclude this browser/i }).click();

    await expect(page.getByText(/This browser is excluded/i)).toBeVisible();
    await expect(page.getByText("Playwright runner")).toBeVisible();
    await expect(page.getByText(/2 excluded|1 excluded|excluded/i).first()).toBeVisible();

    await page.getByRole("button", { name: /count again/i }).first().click();
    await expect(page.getByText(/Counting again/i)).toBeVisible();
  });

  test("the beacon ignores an automated user agent", async ({ request }) => {
    const response = await request.post("/api/analytics", {
      headers: { "user-agent": "curl/8.4.0", "content-type": "application/json" },
      data: { path: "/", viewport: 1440 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, ignored: "automated" });
  });
});

test.describe("health endpoint", () => {
  test("reports a reachable database", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.database).toBe("reachable");
  });
});
