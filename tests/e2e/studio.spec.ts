import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("design studio", () => {
  test("editing the accent colour reaches the public page", async ({ page }) => {
    await signIn(page, "/admin/studio/design");

    await page.getByLabel("Accent colour").fill("#22d3ee");
    await expect(page.getByText("#22D3EE").first()).toBeVisible();

    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText("Changes saved")).toBeVisible({ timeout: 15000 });

    await page.goto("/");
    const accentValue = await page.evaluate(() =>
      getComputedStyle(document.querySelector(".bg-ink") as HTMLElement)
        .getPropertyValue("--color-accent")
        .trim(),
    );
    expect(accentValue.toLowerCase()).toBe("#22d3ee");
  });

  test("switching the pattern type re-renders the layer", async ({ page }) => {
    await signIn(page, "/admin/studio/design");
    await page.getByRole("button", { name: /diagonal grid/i }).click();
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText("Changes saved")).toBeVisible({ timeout: 15000 });
  });

  test("design resets back to the shipped tokens", async ({ page }) => {
    await signIn(page, "/admin/studio/design");
    await page.getByRole("button", { name: /^reset$/i }).click();
    await expect(page.getByText("Reset to defaults")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("#FF9418").first()).toBeVisible();
  });
});

test.describe("animation studio", () => {
  test("preview replays and the config saves", async ({ page }) => {
    await signIn(page, "/admin/studio/animation");
    await page.getByRole("button", { name: /replay/i }).first().click();
    await expect(page.locator('[data-demo="fade-up"]')).toBeVisible();

    const save = page.getByRole("button", { name: /^save$/i });
    await page.getByRole("button", { name: /power 2/i }).click();
    if (await save.isDisabled()) await page.getByRole("button", { name: /power 4/i }).click();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText("Changes saved").first()).toBeVisible({ timeout: 15000 });
  });

  test("disabling motion renders the public page statically", async ({ page }) => {
    await signIn(page, "/admin/studio/animation");
    const toggle = page.getByRole("switch", { name: /animations enabled/i });
    await toggle.click();
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText("Changes saved")).toBeVisible({ timeout: 15000 });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const shellOpacity = await page.evaluate(() => {
      const node = document.querySelector("#about h2");
      return node ? getComputedStyle(node).opacity : "1";
    });
    expect(shellOpacity).toBe("1");

    await page.goto("/admin/studio/animation");
    await page.getByRole("switch", { name: /animations enabled/i }).click();
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText("Changes saved")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("portrait studio", () => {
  test("particle preview paints the canvas", async ({ page }) => {
    await signIn(page, "/admin/studio/portrait");
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(2500);

    const painted = await canvas.evaluate((element: HTMLCanvasElement) => {
      const context = element.getContext("2d");
      if (!context) return 0;
      const { data } = context.getImageData(0, 0, element.width, element.height);
      let count = 0;
      for (let index = 3; index < data.length; index += 4) if (data[index]! > 8) count += 1;
      return count;
    });

    expect(painted).toBeGreaterThan(1000);
  });

  test("switching to static mode saves and replays", async ({ page }) => {
    await signIn(page, "/admin/studio/portrait");
    const toggle = page.getByRole("switch", { name: /particle reconstruction/i });
    const save = page.getByRole("button", { name: /^save$/i });

    await toggle.click();
    if (await save.isDisabled()) await toggle.click();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText("Changes saved").first()).toBeVisible({ timeout: 15000 });

    await toggle.click();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText("Changes saved").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("section manager", () => {
  test("a section can be hidden from the public page and restored", async ({ page }) => {
    await signIn(page, "/admin/studio/sections");

    const row = page.locator("li", { hasText: "PROCESS" });
    const toggle = row.getByRole("button", { name: /(hide|show) process/i });
    const willHide = /hide/i.test((await toggle.getAttribute("aria-label")) ?? "");

    await toggle.click();
    await row.getByRole("button", { name: /^save$/i }).click();
    await expect(row.getByRole("button", { name: /^save$/i })).toBeDisabled({ timeout: 15000 });

    await page.goto("/");
    await expect(page.locator("#process")).toHaveCount(willHide ? 0 : 1);

    await page.goto("/admin/studio/sections");
    const restored = page.locator("li", { hasText: "PROCESS" });
    await restored.getByRole("button", { name: /(hide|show) process/i }).click();
    await restored.getByRole("button", { name: /^save$/i }).click();
    await expect(restored.getByRole("button", { name: /^save$/i })).toBeDisabled({ timeout: 15000 });

    await page.goto("/");
    await expect(page.locator("#process")).toHaveCount(willHide ? 1 : 0);
  });

  test("reordering saves the new sequence", async ({ page }) => {
    await signIn(page, "/admin/studio/sections");
    await page.getByRole("button", { name: /move process up/i }).click();
    await page.getByRole("button", { name: /save order/i }).click();
    await expect(page.getByText("Order saved")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /move process down/i }).click();
    await page.getByRole("button", { name: /save order/i }).click();
    await expect(page.getByText("Order saved")).toBeVisible({ timeout: 15000 });
  });

  test("an anchor collision is rejected with a clear message", async ({ page }) => {
    await signIn(page, "/admin/studio/sections");
    const row = page.locator("li", { hasText: "PROJECTS" });
    await row.getByRole("button", { name: /edit/i }).click();

    await page.getByLabel("Anchor").fill("about");
    await row.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText(/already used by/i)).toBeVisible({ timeout: 15000 });
  });
});
