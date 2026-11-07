import { test, expect } from "@playwright/test";

test.describe("public site", () => {
  test("homepage assembles every published section", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Building");
    for (const anchor of ["#about", "#expertise", "#work", "#services", "#stack", "#process", "#contact"]) {
      await expect(page.locator(anchor).first()).toBeAttached();
    }
  });

  test("navigation anchors resolve to real sections", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation").first();
    await nav.getByRole("link", { name: /^work$/i }).click();
    await expect(page).toHaveURL(/#work$/);
    await expect(page.locator("#work")).toBeInViewport();
  });

  test("case study index lists published projects", async ({ page }) => {
    await page.goto("/work");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Case studies");
    const links = page.locator('a[href^="/work/"]');
    await expect(links.first()).toBeVisible();
    expect(await links.count()).toBeGreaterThan(0);
  });

  test("case study page renders the engineering record", async ({ page }) => {
    await page.goto("/work");
    await page.locator('a[href^="/work/"]').first().click();
    await expect(page.getByText("01 / Problem")).toBeVisible();
    await expect(page.getByText("02 / Architecture")).toBeVisible();
  });

  test("contact form stores a validated inquiry", async ({ page }) => {
    await page.goto("/#contact");
    await page.fill("#name", "Playwright Tester");
    await page.fill("#email", "tester@example.com");
    await page.fill("#message", "We need an agent that triages inbound support tickets automatically.");
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByText("Inquiry received")).toBeVisible({ timeout: 15000 });
  });

  test("contact form rejects a short message", async ({ page }) => {
    await page.goto("/#contact");
    await page.fill("#name", "A");
    await page.fill("#email", "not-an-email");
    await page.fill("#message", "short");
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByText(/Describe the project|valid email|Enter your name/i).first()).toBeVisible();
  });

  test("unknown routes render the branded 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Signal lost")).toBeVisible();
    await expect(page.getByRole("link", { name: /return home/i })).toBeVisible();
  });

  test("search metadata and structured data are emitted", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /https?:\/\//);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
  });

  test("sitemap and robots are served", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("/work/");

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Disallow: /admin");
  });

  test("security headers are present", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  });

  test("reduced motion preference does not break rendering", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
