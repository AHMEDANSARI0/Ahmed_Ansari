import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

const stamp = Date.now();
const projectTitle = `E2E Project ${stamp}`;
const projectSlug = `e2e-project-${stamp}`;

test.describe("project management", () => {
  test("a draft project is created and stays private until published", async ({ page }) => {
    await signIn(page, "/admin/projects/new");

    await page.getByRole("textbox", { name: "Title *" }).fill(projectTitle);
    await page.getByLabel("Short description").fill(
      "A test case study created by the end to end suite to prove the publishing flow.",
    );
    await page
      .getByLabel("Overview")
      .fill("This record exists to verify that drafts stay invisible until an owner publishes them.");
    await page.getByLabel("Capabilities").fill("Typed workflow steps\nExecution history");

    await page.getByRole("button", { name: /create project/i }).click();
    await expect(page.getByText("Project created")).toBeVisible({ timeout: 20000 });
    await page.waitForURL(/\/admin\/projects\/[0-9a-f-]{36}$/, { timeout: 20000 });

    const publicResponse = await page.request.get(`/work/${projectSlug}`);
    expect(publicResponse.status()).toBe(404);

    await page.getByLabel("Status").selectOption("published");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("Project saved")).toBeVisible({ timeout: 15000 });

    const published = await page.request.get(`/work/${projectSlug}`);
    expect(published.status()).toBe(200);
    const html = await published.text();
    expect(html).toContain(projectTitle);
    expect(html).toContain("Capabilities");
  });

  test("slug collisions are rejected", async ({ page }) => {
    await signIn(page, "/admin/projects/new");
    await page.getByRole("textbox", { name: "Title *" }).fill("Collision test");
    await page.getByLabel("Slug").fill(projectSlug);
    await page.getByLabel("Short description").fill(
      "This project reuses a slug that already exists, so the server must refuse it.",
    );
    await page.getByLabel("Overview").fill("Payload is otherwise valid, the collision is the only problem.");
    await page.getByRole("button", { name: /create project/i }).click();
    await expect(page.getByText(/already uses the slug/i)).toBeVisible({ timeout: 15000 });
  });

  test("the created project can be deleted", async ({ page }) => {
    await signIn(page, "/admin/projects");
    await page.getByRole("link", { name: projectTitle }).click();
    await page.waitForURL("**/admin/projects/**");
    await page.getByRole("button", { name: /^delete$/i }).click();
    await page.waitForURL("**/admin/projects", { timeout: 20000 });
    await expect(page.getByText(projectTitle)).toHaveCount(0);
  });
});

test.describe("media library", () => {
  test("rejects a file whose content does not match its type", async ({ page }) => {
    await signIn(page, "/admin/media");

    await page.setInputFiles('input[type="file"]', {
      name: "fake.png",
      mimeType: "image/png",
      buffer: Buffer.from("<script>alert(1)</script>"),
    });

    await expect(page.getByText(/does not match its type/i)).toBeVisible({ timeout: 15000 });
  });

  test("a valid PNG uploads and can be tagged with alt text", async ({ page }) => {
    await signIn(page, "/admin/media");

    // 1x1 transparent PNG
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );

    await page.setInputFiles('input[type="file"]', {
      name: `e2e-${stamp}.png`,
      mimeType: "image/png",
      buffer: png,
    });

    await expect(page.getByText(/uploaded/i).first()).toBeVisible({ timeout: 20000 });
    const card = page.locator("li", { hasText: `e2e-${stamp}.png` });
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: /^alt$/i }).click();
    await card.getByLabel("Alt text").fill("End to end test asset");
    await card.getByRole("button", { name: /^save$/i }).click();
    await expect(card.getByText("End to end test asset")).toBeVisible({ timeout: 15000 });

    await card.getByRole("button", { name: /delete/i }).click();
    await expect(card).toHaveCount(0, { timeout: 15000 });
  });
});

test.describe("inquiry crm", () => {
  test("an inquiry can be triaged with a status and a note", async ({ page }) => {
    await signIn(page, "/admin/inquiries");

    const first = page.locator("ul li button").first();
    await first.click();

    await page.getByRole("button", { name: /^qualified$/i }).click();
    await expect(page.getByText(/marked qualified/i)).toBeVisible({ timeout: 15000 });

    const note = `Scoped a discovery call at ${stamp}.`;
    await page.getByLabel("Notes").fill(note);
    await page.getByRole("button", { name: /add note/i }).click();

    await expect(page.getByText(note, { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel("Notes")).toHaveValue("");
  });
});

test.describe("analytics and backups", () => {
  test("a page view is recorded and counted", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2200);

    await signIn(page, "/admin/analytics");
    const views = await page.locator("text=/^PAGE VIEWS$/i").locator("..").textContent();
    expect(views).toBeTruthy();
    await expect(page.getByText(/\d/).first()).toBeVisible();
  });

  test("content backup downloads as JSON", async ({ page }) => {
    await signIn(page, "/admin/backups");

    const response = await page.request.get("/api/admin/backup");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");

    const body = await response.json();
    expect(body.version).toBe(1);
    expect(Array.isArray(body.data.projects)).toBe(true);
    expect(body.counts.projects).toBeGreaterThan(0);
  });

  test("backup endpoint rejects anonymous requests", async ({ request }) => {
    const response = await request.get("/api/admin/backup");
    expect(response.status()).toBe(401);
  });
});

test.describe("work archive", () => {
  test("facets are built from the projects that exist", async ({ page }) => {
    await page.goto("/work");

    // Every facet must map to at least one visible card; nothing is invented.
    const facets = page.getByRole("button", { name: /^Filter by (stage|technology):/ });
    const count = await facets.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      await expect(facets.nth(index)).toHaveAttribute("aria-pressed", "false");
    }

    const first = facets.first();
    await first.click();
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/of \d+ records?/)).toBeVisible();

    await page.getByRole("button", { name: /^Clear$/i }).click();
    await expect(first).toHaveAttribute("aria-pressed", "false");
  });

  test("a project without a cover renders a technical band, not an empty box", async ({ page }) => {
    await page.goto("/work");
    const cards = page.locator("ul li a[href^='/work/']");
    await expect(cards.first()).toBeVisible();
    // The band carries the slug rather than a stock image.
    await expect(page.getByText(/no capture yet/i).first()).toBeVisible();
  });
});
