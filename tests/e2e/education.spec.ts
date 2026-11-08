import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

/**
 * Education CMS. The form is asserted through the database, not the cached public
 * HTML: the public page is cached for five minutes by design.
 */
test.describe("education cms", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "/admin/education");
  });

  test("lists the page and explains the empty state honestly", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
    await expect(page.getByText(/Nothing is rendered on the public site while this list is empty/i)).toBeVisible();
  });

  test("rejects an end year before the start year without writing a row", async ({ page }) => {
    await page.getByRole("button", { name: /add entry/i }).click();
    await page.getByLabel(/Institution/i).fill("Test Institute");
    await page.getByLabel(/Programme/i).fill("Test Programme");
    await page.getByLabel(/Start year/i).fill("2022");
    await page.getByLabel(/End year/i).fill("2019");
    await page.getByRole("button", { name: /^Add entry$/i }).click();

    await expect(page.getByText(/end year cannot be before the start year/i)).toBeVisible();
  });

  test("creates, reorders and deletes an entry", async ({ page }) => {
    await page.getByRole("button", { name: /add entry/i }).click();
    await page.getByLabel(/Institution/i).fill("Playwright University");
    await page.getByLabel(/Programme/i).fill("E2E Verification");
    await page.getByLabel(/Start year/i).fill("2020");
    await page.getByLabel(/End year/i).fill("2024");
    await page.getByRole("button", { name: /^Add entry$/i }).click();

    await expect(page.getByText("Playwright University")).toBeVisible();
    await expect(page.getByText("2020 — 2024")).toBeVisible();

    await page.getByRole("button", { name: /edit e2e verification/i }).click();
    await page.getByLabel(/Programme/i).fill("E2E Verification Edited");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("E2E Verification Edited")).toBeVisible();

    // Deletion is confirmed through a native dialog.
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: /delete e2e verification edited/i }).click();
    await expect(page.getByText("E2E Verification Edited")).toHaveCount(0);
  });

  test("an empty end year renders as present", async ({ page }) => {
    await page.getByRole("button", { name: /add entry/i }).click();
    await page.getByLabel(/Institution/i).fill("Ongoing Institute");
    await page.getByLabel(/Programme/i).fill("Ongoing Programme");
    await page.getByLabel(/Start year/i).fill("2024");
    await page.getByRole("button", { name: /^Add entry$/i }).click();

    await expect(page.getByText("2024 — present")).toBeVisible();

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: /delete ongoing programme/i }).click();
    await expect(page.getByText("Ongoing Programme")).toHaveCount(0);
  });
});
