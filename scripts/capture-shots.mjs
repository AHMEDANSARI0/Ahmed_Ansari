#!/usr/bin/env node
/**
 * Captures a cover shot for every live demo, so the portfolio never shows an
 * empty box and nothing has to be invented.
 *
 *   npm run shots:capture
 *
 * Requires Playwright browsers once: npx playwright install chromium
 *
 * Output: public/shots/<slug>.png at 1440x900, then it tells you the two steps
 * that make the images appear (media upload + cover field in /admin/projects).
 *
 * Every URL below is a real deployment owned by the repository owner. If a site
 * is down the script records it and continues; it never substitutes a stock image.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const targets = [
  {
    slug: "omniflow",
    url: "https://omniflow-bice.vercel.app",
    waitFor: "networkidle",
  },
  {
    slug: "omni-assistant",
    url: "https://github.com/AHMEDANSARI0/Omni-Assistant",
    waitFor: "load",
  },
  {
    slug: "ecommerce-platform",
    url: "https://e-com-site-alpha.vercel.app",
    waitFor: "networkidle",
  },
  {
    slug: "business-automation-systems",
    url: "https://hakathon-e-com-site.vercel.app",
    waitFor: "networkidle",
  },
];

const outputDir = "public/shots";

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    // A normal desktop UA so the demo sites serve their real layout.
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  });

  const report = [];

  for (const target of targets) {
    const page = await context.newPage();
    const file = `${outputDir}/${target.slug}.png`;
    try {
      const response = await page.goto(target.url, {
        waitUntil: target.waitFor,
        timeout: 45_000,
      });

      // Cookie banners and chat widgets ruin a first impression of a screenshot.
      await page.addStyleTag({
        content:
          "[id*=cookie],[class*=cookie],[id*=consent],[class*=consent],[class*=chat-widget]{display:none !important}",
      });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: file, animations: "disabled" });

      report.push({ slug: target.slug, url: target.url, status: response?.status() ?? 0, file, ok: true });
    } catch (error) {
      report.push({
        slug: target.slug,
        url: target.url,
        ok: false,
        error: error instanceof Error ? error.message.split("\n")[0] : String(error),
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  await writeFile(`${outputDir}/capture-report.json`, JSON.stringify(report, null, 2));

  for (const entry of report) {
    if (entry.ok) console.log(`✓ ${entry.slug} -> ${entry.file} (HTTP ${entry.status})`);
    else console.log(`✗ ${entry.slug} -> ${entry.url} (${entry.error})`);
  }

  const captured = report.filter((entry) => entry.ok).length;
  console.log(`\n${captured}/${report.length} captured. Report: ${outputDir}/capture-report.json`);
  console.log("Next: /admin/media → upload each PNG, then set it as the cover in /admin/projects.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
