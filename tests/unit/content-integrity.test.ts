import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { defaultHeroContent, SECTION_ANCHORS, SECTION_KEYS } from "@/lib/config/sections";
import { defaultSiteSettings, SITE_DEFAULTS } from "@/lib/config/site";
import { sectionSeed } from "@/scripts/seed-data";

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const SOURCES = walk(join(ROOT, "app")).concat(walk(join(ROOT, "components")));

describe("anchors", () => {
  it("every CTA in the seed targets an anchor that a section actually owns", () => {
    const anchors = new Set(sectionSeed.map((section) => section.anchor));
    const hrefs: string[] = [];

    for (const section of sectionSeed) {
      const fields = section.fields as Record<string, unknown>;
      for (const key of ["primaryCta", "secondaryCta"]) {
        const value = fields[key] as { href?: string } | undefined;
        if (value?.href?.startsWith("#")) hrefs.push(value.href);
      }
    }

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(anchors.has(href.slice(1)), `${href} has no section`).toBe(true);
    }
  });

  it("the fallback hero copy points at the work anchor", () => {
    expect(SECTION_ANCHORS.projects).toBe("work");
    expect(defaultHeroContent.primaryCta.href).toBe("#work");
    expect(SECTION_KEYS).toContain("projects");
  });
});

describe("public copy", () => {
  it("never ships a SECTION 0N eyebrow", () => {
    for (const section of sectionSeed) {
      expect(section.eyebrow).not.toMatch(/^SECTION \d+/);
    }
    for (const file of SOURCES) {
      expect(readFileSync(file, "utf8")).not.toMatch(/SECTION 0\d/);
    }
  });

  it("keeps the contact description different from the first paragraph", () => {
    const contact = sectionSeed.find((section) => section.key === "contact");
    expect(contact?.description).not.toMatch(/reply with a technical point of view/i);
  });

  it("does not seed placeholder credentials", () => {
    expect(sectionSeed.some((section) => /your university|your degree/i.test(JSON.stringify(section)))).toBe(
      false,
    );
  });
});

describe("identity", () => {
  it("uses the real mailbox, not a domain that has no mailbox", () => {
    expect(SITE_DEFAULTS.email).toBe("ahmedehtesham15@gmail.com");
    expect(defaultSiteSettings.email).toBe(SITE_DEFAULTS.email);
  });

  it("points the canonical domain at the deployment that exists", () => {
    expect(SITE_DEFAULTS.domain).toBe("https://ahmedansari.vercel.app");
  });

  it("links the owner's real profiles", () => {
    const github = defaultSiteSettings.socialLinks.find((link) => link.platform === "github");
    const linkedin = defaultSiteSettings.socialLinks.find((link) => link.platform === "linkedin");
    expect(github?.url).toBe("https://github.com/AHMEDANSARI0");
    expect(linkedin?.url).toContain("ahmedansari15");
  });

  it("starts with nobody excluded from analytics", () => {
    expect(defaultSiteSettings.analytics.excludedVisitors).toEqual([]);
  });
});

describe("repository hygiene", () => {
  it("contains no editor backup files", () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      if (/\.bak(\.|$)/.test(file)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("does not print developer notes on the public hero", () => {
    const hero = readFileSync(join(ROOT, "components/sections/hero.tsx"), "utf8");
    expect(hero).not.toContain('"REPLACE IN ADMIN"');
    expect(hero).toContain("PORTRAIT PENDING");
  });
});
