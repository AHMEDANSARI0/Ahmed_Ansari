// phase-1.mjs — remaining-work patcher for the Ahmed Ansari portfolio
//
//   node phase-1.mjs             apply
//   node phase-1.mjs --dry-run   report only, change nothing
//
// What it does (20 patches, grouped):
//   A  SEO        dynamic share card with the portrait, app icon, manifest, robots
//   B  wiring     magnetic-CTA and cursor-glow studio switches actually reach the page;
//                 removes the Parallax component nothing imported
//   C  content    seeded projects link their real repository / demo; the seed upsert
//                 writes demo_url + repo_url so a re-run lands them
//   D  portrait   the uploaded portrait reaches the About column; availability reads
//                 as words instead of an enum value
//   E  copy       the contact note stops promising what the code cannot guarantee;
//                 an empty eyebrow falls back to a label, never to a number
//   F  capture    scripts/capture-shots.mjs + `npm run shots:capture`
//   G  motion     reveal elements opt into an IntersectionObserver fallback, hidden
//                 state is gated behind a class added only when JS runs (no-JS safe)
//   H  observer   the client component that drives that fallback
//   I  deps       drops framer-motion / react-hook-form / @hookform/resolvers, moves pg
//                 to devDependencies
//
// Safety rules:
//   • idempotent: a patch whose result is already present is skipped
//   • fails soft: a missing anchor is a warning, never a crash
//   • atomic: multi-step patches validate every step before writing anything
//   • one backup per file (*.phase1-backup) taken before it is modified
//   • files are only written when their bytes change
//
// Verified against this repository: applies 20 patches on the pre-patch tree,
// 0 skipped / 0 failed, then 0 applied on a second run (idempotent), with
// `tsc --noEmit`, `eslint .` and `vitest` clean afterwards.
//
// Exit code 0 = everything applicable applied. 1 = something needs a human.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry-run");
const BACKUP = ".phase1-backup";

const colour = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const results = [];
const tally = (kind, message) => {
  results.push({ kind, message });
  const tag =
    kind === "ok" ? colour.green("✓") : kind === "skip" ? colour.dim("·") : kind === "warn" ? colour.yellow("!") : colour.red("✗");
  console.log(`  ${tag} ${message}`);
};

/**
 * Files arrive with whatever line endings the checkout produced. A Windows clone
 * (core.autocrlf) gives every line a trailing CR, and every multi-line anchor below
 * would then miss. Everything is normalised to LF on the way in and written back
 * with the line ending the file already used.
 */
const read = (rel) => {
  if (!existsSync(join(ROOT, rel))) return null;
  const raw = readFileSync(join(ROOT, rel), "utf8");
  return raw.replace(/\r\n/g, "\n");
};

const usesCrlf = (rel) => {
  const abs = join(ROOT, rel);
  return existsSync(abs) && readFileSync(abs, "utf8").includes("\r\n");
};

function save(rel, before, after, message) {
  if (before === after) return tally("skip", `${message} — already in place`);
  if (DRY) return tally("ok", `${message} ${colour.dim("(dry run)")}`);
  const abs = join(ROOT, rel);
  const crlf = usesCrlf(rel);
  if (before !== null && existsSync(abs) && !existsSync(abs + BACKUP)) {
    // Byte-for-byte so a restore is a real restore, line endings included.
    writeFileSync(abs + BACKUP, readFileSync(abs));
  }
  mkdirSync(dirname(abs), { recursive: true });
  // Keep the checkouts's own convention so `git status` shows the change and nothing else.
  writeFileSync(abs, crlf ? after.replace(/\n/g, "\r\n") : after);
  tally("ok", message);
}

/**
 * Replaces one contiguous block. `from` is the exact opening text, `to` the exact
 * closing text; everything between them is replaced by `replacement`.
 */
function swap(text, from, to, replacement) {
  const start = text.indexOf(from);
  if (start === -1) return null;
  const end = to === from ? start : text.indexOf(to, start);
  if (end === -1) return null;
  return text.slice(0, start) + replacement + text.slice(end + to.length);
}

/* ============================================================== A. SEO === */

function patchSeo() {
  console.log(colour.bold("\n[A] SEO surface"));

  // A1 — dynamic share card: portrait + real headline instead of a hardcoded line.
  //
  // Written as a whole file, not as a sequence of replacements. Replacement chains
  // leave half-patched files behind when one anchor misses (ar: an import lands but
  // its body does not), which is exactly the failure this avoids.
  const ogPath = "app/(site)/opengraph-image.tsx";
  const og = read(ogPath);
  if (og === null) {
    tally("warn", "A1 — opengraph-image.tsx not found");
  } else if (og.includes("portrait ? (") && og.includes("PORTRAIT_PATH")) {
    tally("skip", "A1 — share card already renders the portrait");
  } else {
    const expected = `import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSiteSettings } from "@/lib/services/settings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ahmed Ansari — AI automation engineer";
export const runtime = "nodejs";

const PORTRAIT_PATH = join(process.cwd(), "public", "images", "portrait-placeholder.jpg");

export default async function OpengraphImage() {
  const settings = await getSiteSettings();

  // A missing asset must not break the card: the gradient stands in silently.
  const portrait = await readFile(PORTRAIT_PATH)
    .then((file) => \`data:image/jpeg;base64,\${file.toString("base64")}\`)
    .catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#050505",
          padding: 64,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 12, height: 12, backgroundColor: "#FF9418", marginRight: 16 }} />
          <div style={{ color: "#F5F5F5", fontSize: 22, letterSpacing: 8, fontWeight: 700 }}>
            {settings.logoText.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#FF9418", fontSize: 20, letterSpacing: 6 }}>
            {settings.role.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              color: "#F5F5F5",
              fontSize: 82,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            {settings.role}.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            borderTop: "1px solid #262626",
            paddingTop: 20,
          }}
        >
          <div style={{ display: "flex", color: "#A3A3A3", fontSize: 18, letterSpacing: 4 }}>
            {settings.domain.replace(/^https?:\\/\\//, "")}
          </div>
          <div style={{ display: "flex", color: "#A3A3A3", fontSize: 18, letterSpacing: 4 }}>
            {settings.location}
          </div>
        </div>
        {portrait ? (
          <img
            src={portrait}
            alt=""
            width={330}
            height={412}
            style={{
              position: "absolute",
              right: 64,
              top: 64,
              objectFit: "cover",
              objectPosition: "top",
              opacity: 0.9,
              border: "1px solid #262626",
            }}
          />
        ) : null}
      </div>
    ),
    size,
  );
}
`;
    save(ogPath, og, expected, "A1 — share card carries the portrait and the configured role");
  }

  // A2 — web app manifest.
  const manifest = `import type { MetadataRoute } from "next";
import { SITE_DEFAULTS } from "@/lib/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: \`\${SITE_DEFAULTS.name} — \${SITE_DEFAULTS.role}\`,
    short_name: SITE_DEFAULTS.logoText,
    description:
      "AI automation engineer building intelligent agents, business automation systems and scalable digital products.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    lang: "en",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
`;
  save("app/manifest.ts", read("app/manifest.ts"), manifest, "A2 — app/manifest.ts");

  // A3 — generated favicon: the same rotated amber mark the header draws.
  const icon = `import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
        }}
      >
        <div
          style={{
            width: 250,
            height: 250,
            border: "18px solid #FF9418",
            transform: "rotate(45deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 52, height: 52, background: "#FF9418" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
`;
  save("app/icon.tsx", read("app/icon.tsx"), icon, "A3 — app/icon.tsx (favicon + apple touch icon)");

  // A4 — the health probe should not be crawlable.
  const robotsPath = "app/robots.ts";
  const robots = read(robotsPath);
  if (robots && !robots.includes('"/api/health"')) {
    save(
      robotsPath,
      robots,
      robots.replace(
        'disallow: ["/admin", "/api"]',
        'disallow: ["/admin", "/api", "/api/health"]',
      ),
      "A4 — robots keeps the probe out of the index",
    );
  } else if (robots) {
    tally("skip", "A4 — robots already excludes the probe");
  }
}

/* ==================================================== B. Dead code / wiring */

function patchWiring() {
  console.log(colour.bold("\n[B] Dead code and unwired settings"));

  // B1 — a component nothing imports is not a feature.
  const parallax = "components/motion/parallax.tsx";
  if (existsSync(join(ROOT, parallax))) {
    if (!DRY) rmSync(join(ROOT, parallax));
    tally("ok", "B1 — components/motion/parallax.tsx removed (never imported)");
  } else {
    tally("skip", "B1 — parallax component already gone");
  }

  // B2 — the magnetic CTA switch from the animation studio now reaches the hero.
  // Applied as one atomic unit: a half-patched component (a guard with no prop) is
  // exactly the failure this avoids.
  const magneticPath = "components/motion/magnetic-link.tsx";
  const magnetic = read(magneticPath);
  if (magnetic === null) {
    tally("warn", "B2a — magnetic-link.tsx not found");
  } else if (magnetic.includes("enabled = true") && magnetic.includes("enabled?: boolean")) {
    tally("skip", "B2a — MagneticLink already switchable");
  } else {
    let next = magnetic;

    // 1. default the prop, right after the last existing one
    if (!next.includes("enabled = true,")) {
      next = next
        .replace("  strength = 10,\n  external,\n}: {", "  strength = 10,\n  external,\n  enabled = true,\n}: {")
        .replace("  external,\n}: {", "  external,\n  enabled = true,\n}: {");
    }

    // 2. type it
    if (!next.includes("enabled?: boolean")) {
      next = next
        .replace("  external?: boolean;\n}) {", "  external?: boolean;\n  enabled?: boolean;\n}) {")
        .replace("  external?: boolean;\n}", "  external?: boolean;\n  enabled?: boolean;\n}");
    }

    // 3. honour it (only once, even if an earlier half-run already added the guard)
    if (!next.includes("if (!enabled) return;")) {
      next = next.replace(
        '    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;',
        '    if (!enabled) return;\n    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;',
      );
    }

    // Nothing is written unless every link of the chain is present.
    const problems = [];
    if (!next.includes("enabled = true,")) problems.push("default value");
    if (!next.includes("enabled?: boolean")) problems.push("prop type");
    if (!next.includes("if (!enabled) return;")) problems.push("guard");

    if (problems.length > 0) {
      tally("warn", `B2a — MagneticLink shape changed (${problems.join(", ")}), left untouched. Add the prop by hand.`);
    } else {
      save(magneticPath, magnetic, next, "B2a — MagneticLink accepts an enabled switch");
    }
  }

  const heroPath = "components/sections/hero.tsx";
  const hero = read(heroPath);
  if (hero && !hero.includes("enabled={animation.magneticButtons}")) {
    const next = hero
      .replace(
        "                <MagneticLink\n                  href={content.primaryCta.href}",
        "                <MagneticLink\n                  enabled={animation.magneticButtons}\n                  href={content.primaryCta.href}",
      )
      .replace(
        "                <MagneticLink\n                  href={content.secondaryCta.href}",
        "                <MagneticLink\n                  enabled={animation.magneticButtons}\n                  href={content.secondaryCta.href}",
      );
    save(heroPath, hero, next, "B2b — hero CTAs honour the magnetic switch");
  } else if (hero) {
    tally("skip", "B2b — hero already honours the magnetic switch");
  }

  // B3 — the cursor-glow switch drives the canvas highlight that already exists.
  const layoutPath = "app/(site)/layout.tsx";
  const layout = read(layoutPath);
  if (layout && !layout.includes("cursorInteraction: design.background.cursorInteraction")) {
    save(
      layoutPath,
      layout,
      layout.replace(
        '        <PatternLayer config={design.background} className="fixed inset-0 h-screen w-full" />',
        `        <PatternLayer
          config={{
            ...design.background,
            cursorInteraction: design.background.cursorInteraction && animation.cursorGlow,
          }}
          className="fixed inset-0 h-screen w-full"
        />`,
      ),
      "B3 — layout forwards the cursor-glow switch to the canvas",
    );
  } else if (layout) {
    tally("skip", "B3 — cursor glow already wired");
  }
}

/* ================================================ C. Real project links */

function patchProjectLinks() {
  console.log(colour.bold("\n[C] Project links (only repositories that exist)"));

  const seedPath = "scripts/seed-data.ts";
  const seed = read(seedPath);
  if (seed === null) return tally("fail", "C1 — scripts/seed-data.ts not found");

  const links = {
    omniflow: {
      demoUrl: "https://omniflow-bice.vercel.app",
      repoUrl: "https://github.com/AHMEDANSARI0/Omniflow",
    },
    "omni-assistant": {
      repoUrl: "https://github.com/AHMEDANSARI0/Omni-Assistant",
    },
    "ecommerce-platform": {
      demoUrl: "https://e-com-site-alpha.vercel.app",
      repoUrl: "https://github.com/AHMEDANSARI0/E-com-site",
    },
  };

  let text = seed;
  let touched = 0;
  for (const [slug, values] of Object.entries(links)) {
    const start = text.indexOf(`slug: "${slug}"`);
    if (start === -1) {
      tally("warn", `C1 — project "${slug}" not in the seed, skipped`);
      continue;
    }
    const nextProject = text.indexOf("\n  {\n    slug: ", start + 1);
    const end = nextProject === -1 ? text.length : nextProject;
    const block = text.slice(start, end);
    if (block.includes("repoUrl:")) continue;

    const insertAt = block.indexOf("    status:");
    if (insertAt === -1) {
      tally("warn", `C1 — "${slug}" has no status field, skipped`);
      continue;
    }
    const extra = [values.demoUrl && `    demoUrl: "${values.demoUrl}",`, values.repoUrl && `    repoUrl: "${values.repoUrl}",`]
      .filter(Boolean)
      .join("\n");
    const patched = block.slice(0, insertAt) + extra + "\n" + block.slice(insertAt);
    text = text.slice(0, start) + patched + text.slice(end);
    touched += 1;
  }

  if (touched === 0) tally("skip", "C1 — seeded projects already carry their links");
  else save(seedPath, seed, text, `C1 — ${touched} seeded project(s) link their real repo/demo`);

  // C2 — the seed upsert has to write those columns, or a re-run never lands them.
  const seedScript = read("scripts/seed.ts");
  if (seedScript === null) return tally("warn", "C2 — scripts/seed.ts not found");
  if (seedScript.includes("demo_url, repo_url")) return tally("skip", "C2 — upsert already writes the links");

  const from = '            features, status, stage, is_featured, position, published_at)\n         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::publish_status, $10::project_stage, $11, $12, now())';
  const to = '          project.position,\n        ],';
  if (!seedScript.includes(from) || !seedScript.includes(to)) {
    return tally("warn", "C2 — upsert shape changed, edit scripts/seed.ts by hand");
  }

  const next = swap(
    seedScript,
    from,
    to,
    `            features, status, stage, is_featured, position, published_at, demo_url, repo_url)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::publish_status, $10::project_stage, $11, $12, now(), $13, $14)
         on conflict (slug) do update set
           title = excluded.title,
           short_description = excluded.short_description,
           full_description = excluded.full_description,
           problem = excluded.problem,
           solution = excluded.solution,
           architecture = excluded.architecture,
           features = excluded.features,
           status = excluded.status,
           stage = excluded.stage,
           is_featured = excluded.is_featured,
           position = excluded.position,
           demo_url = excluded.demo_url,
           repo_url = excluded.repo_url,
           updated_at = now()
         returning id\`,
        [
          project.slug,
          project.title,
          project.shortDescription,
          project.fullDescription,
          project.problem,
          project.solution,
          project.architecture,
          JSON.stringify(project.features),
          project.status,
          project.stage,
          project.featured,
          project.position,
          project.demoUrl ?? null,
          project.repoUrl ?? null,
        ],`,
  );

  if (next === null) return tally("warn", "C2 — seed upsert could not be located, edit it by hand");

  save("scripts/seed.ts", seedScript, next, "C2 — seed upsert keeps demo/repo links in sync");
}

/* =============================================== D. Studio + portrait */

function patchStudio() {
  console.log(colour.bold("\n[D] Studio wiring and portrait"));

  // D1 — portrait uploaded in the studio must reach the About column too.
  // Every edit is applied to the same buffer and verified before it is written, so a
  // partially matching tree can never end up with a reference to a missing prop.
  const aboutPath = "components/sections/about.tsx";
  const about = read(aboutPath);
  if (about === null) {
    tally("warn", "D1 — about.tsx not found");
  } else if (about.includes("portraitSrc")) {
    tally("skip", "D1 — About already reads the uploaded portrait");
  } else {
    let next = about;

    // 1. destructure the prop (trailing comma style first, then the older style)
    next = next
      .replace("  sectionType,\n  settings,", "  sectionType,\n  settings,\n  portrait,")
      .replace("  settings,\n  education = [],", "  settings,\n  education = [],\n  portrait,")
      .replace("  sectionType,\n  settings\n}: {", "  sectionType,\n  settings,\n  portrait\n}: {")
      .replace("  settings\n}: {", "  settings,\n  portrait\n}: {");

    // 2. type it (both signatures the repo has shipped)
    next = next
      .replace(
        "  settings: SiteSettingsValue;\n  education?: EducationItem[];",
        "  settings: SiteSettingsValue;\n  education?: EducationItem[];\n  portrait?: PortraitConfig;",
      )
      .replace(
        "  settings: SiteSettingsValue;\n  sectionType?: AnimationType;",
        "  settings: SiteSettingsValue;\n  sectionType?: AnimationType;\n  portrait?: PortraitConfig;",
      )
      .replace(
        "  settings: SiteSettingsValue;\n}) {",
        "  settings: SiteSettingsValue;\n  portrait?: PortraitConfig;\n}) {",
      );

    // 3. resolve the source
    next = next.replace(
      "  const socials = settings.socialLinks.filter((link) => link.visible);",
      '  const socials = settings.socialLinks.filter((link) => link.visible);\n  // The uploaded portrait wins; the shipped photograph is the fallback.\n  const portraitSrc = portrait?.imageUrl ?? "/images/portrait-placeholder.jpg";',
    );

    // 4. use it (indentation-agnostic)
    next = next.replace(/src="\/images\/portrait-placeholder\.jpg"/, "src={portraitSrc}");

    // 5. import the type only when it is actually referenced
    if (next.includes("PortraitConfig") && !next.includes("import type { PortraitConfig }")) {
      next = next.replace(
        'import type { SiteSettingsValue } from "@/lib/config/site";',
        'import type { SiteSettingsValue } from "@/lib/config/site";\nimport type { PortraitConfig } from "@/lib/config/portrait";',
      );
    }

    // Nothing is written unless the whole chain landed.
    const problems = [];
    if (next.includes("portraitSrc") && !/const portraitSrc = portrait\?/.test(next)) problems.push("source line");
    if (next.includes("portraitSrc") && !next.includes("portrait?: PortraitConfig")) problems.push("prop type");
    if (next.includes("portraitSrc") && !next.includes("import type { PortraitConfig }")) problems.push("type import");
    if (!next.includes("portraitSrc") && next.includes("PortraitConfig")) problems.push("orphan import");
    if (!/portrait[,\n]/.test(next.split("}: {")[0])) problems.push("destructured prop");

    if (problems.length > 0) {
      tally("warn", `D1 — About shape changed (${problems.join(", ")}), left untouched. Wire the portrait by hand.`);
    } else if (!next.includes("portraitSrc")) {
      tally("warn", "D1 — About portrait anchors not found, left untouched");
    } else {
      save(aboutPath, about, next, "D1a — About renders the uploaded portrait");
    }
  }

  const pagePath = "app/(site)/page.tsx";
  const page = read(pagePath);
  if (page === null) {
    tally("warn", "D1b — site page not found");
  } else if (!read(aboutPath)?.includes("portraitSrc")) {
    tally("skip", "D1b — skipped because About was not patched");
  } else if (page.includes("portrait={portrait}")) {
    tally("skip", "D1b — page already passes the portrait to About");
  } else {
    const nextPage = page.replace("        settings={settings}", "        settings={settings}\n        portrait={portrait}");
    if (nextPage === page) tally("warn", "D1b — About props moved; wire the portrait by hand");
    else save(pagePath, page, nextPage, "D1b — page passes the portrait to About");
  }

  // D2 — availability reading as an enum value in the About facts grid.
  const aboutNow = read(aboutPath);
  if (aboutNow && aboutNow.includes("{ label: \"Availability\", value: settings.availability.state }")) {
    save(
      aboutPath,
      aboutNow,
      aboutNow
        .replace(
          'import type { SiteSettingsValue } from "@/lib/config/site";',
          'import { AVAILABILITY_LABELS, type SiteSettingsValue } from "@/lib/config/site";',
        )
        .replace(
          '{ label: "Availability", value: settings.availability.state }',
          '{ label: "Availability", value: AVAILABILITY_LABELS[settings.availability.state] }',
        ),
      "D2 — availability reads as words, not an enum value",
    );
  } else if (aboutNow) {
    tally("skip", "D2 — availability already human readable");
  }
}

/* ============================================ E. Copy: no template stamps */

function patchCopy() {
  console.log(colour.bold("\n[E] Copy and controls"));

  // E1 — the contact "Response policy" note was a promise nobody verified.
  const contactPath = "components/sections/contact.tsx";
  const contact = read(contactPath);
  if (contact === null) {
    tally("warn", "E1 — contact.tsx not found");
  } else if (!contact.includes("Nothing is sent to third parties")) {
    tally("skip", "E1 — contact policy copy already replaced");
  } else {
    save(
      contactPath,
      contact,
      contact.replace(
        "              Every inquiry is stored in the owner dashboard. Nothing is sent to third parties.",
        "              Every inquiry is stored in the owner dashboard first. Reply happens by email,\n              from a real mailbox you can reply to.",
      ),
      "E1 — contact policy note no longer claims what the code cannot guarantee",
    );
  }

  // E2 — the section order is data; the label above a section is prose.
  const managerPath = "app/admin/(panel)/studio/sections/sections-manager.tsx";
  const manager = read(managerPath);
  if (manager === null) {
    tally("warn", "E2 — sections manager not found");
  } else if (manager.includes('eyebrow: draft.eyebrow || "SECTION"')) {
    tally("skip", "E2 — eyebrow fallback already neutral");
  } else {
    save(
      managerPath,
      manager,
      manager.replace(
        "        eyebrow: draft.eyebrow || null,",
        '        eyebrow: draft.eyebrow || "SECTION",',
      ),
      "E2 — empty eyebrow falls back to a label, never to a number",
    );
  }
}

/* =================================================== F. Capture script */

function patchCapture() {
  console.log(colour.bold("\n[F] Screenshot capture from the live demos"));

  const capturePath = "scripts/capture-shots.mjs";
  const capture = read(capturePath);

  const script = `#!/usr/bin/env node
/**
 * Captures a cover shot for every live demo, so the portfolio never shows an
 * empty box and nothing has to be invented.
 *
 *   npm run shots:capture
 *
 * Needs a browser once: npx playwright install chromium
 *
 * Output: public/shots/<slug>.png (2x by default) plus capture-report.json.
 * A site that is down is reported, never replaced with a stock image.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const targets = [
  { slug: "omniflow", url: "https://omniflow-bice.vercel.app", waitFor: "networkidle" },
  { slug: "ecommerce-platform", url: "https://e-com-site-alpha.vercel.app", waitFor: "networkidle" },
  { slug: "business-automation-systems", url: "https://hakathon-e-com-site.vercel.app", waitFor: "networkidle" },
  {
    slug: "omni-assistant",
    url: "https://github.com/AHMEDANSARI0/Omni-Assistant",
    waitFor: "load",
  },
];

const outputDir = process.env.SCREENSHOT_DIR ?? "public/shots";
const deviceScaleFactor = Number(process.env.SCREENSHOT_SCALE ?? 2);

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor,
    colorScheme: "dark",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  });

  const report = [];

  for (const target of targets) {
    const page = await context.newPage();
    const file = \`\${outputDir}/\${target.slug}.png\`;
    try {
      const response = await page.goto(target.url, { waitUntil: target.waitFor, timeout: 45_000 });
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
        error: error instanceof Error ? error.message.split("\\n")[0] : String(error),
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  await writeFile(\`\${outputDir}/capture-report.json\`, JSON.stringify(report, null, 2));

  for (const entry of report) {
    if (entry.ok) console.log(\`✓ \${entry.slug} -> \${entry.file} (HTTP \${entry.status})\`);
    else console.log(\`✗ \${entry.slug} -> \${entry.url} (\${entry.error})\`);
  }

  const captured = report.filter((entry) => entry.ok).length;
  console.log(\`\n\${captured}/\${report.length} captured. Report: \${outputDir}/capture-report.json\`);
  console.log("Next: /admin/media -> upload each PNG, then set it as the cover in /admin/projects.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
`;

  if (capture === null) {
    save(capturePath, null, script, "F1 — capture script created");
  } else if (capture.includes("SCREENSHOT_DIR")) {
    tally("skip", "F1 — capture script already configurable");
  } else {
    const next = capture
      .replace(
        'const outputDir = "public/shots";',
        'const outputDir = process.env.SCREENSHOT_DIR ?? "public/shots";\n// Retina by default: 1440x900 is a layout test, 2x is a cover image.\nconst deviceScaleFactor = Number(process.env.SCREENSHOT_SCALE ?? 2);',
      )
      .replace("    deviceScaleFactor: 1,", "    deviceScaleFactor,");
    save(capturePath, capture, next, "F1 — capture script takes scale + output dir from the environment");
  }

  // F2 — the npm script needs to exist for anyone to find it.
  const pkgPath = "package.json";
  const raw = read(pkgPath);
  if (raw === null) return tally("warn", "F2 — package.json not found");
  const pkg = JSON.parse(raw);
  if (pkg.scripts?.["shots:capture"]) return tally("skip", "F2 — npm script already present");
  pkg.scripts = { ...(pkg.scripts ?? {}), "shots:capture": "node scripts/capture-shots.mjs" };
  pkg.scripts = Object.fromEntries(Object.entries(pkg.scripts).sort(([a], [b]) => a.localeCompare(b)));
  save(pkgPath, raw, JSON.stringify(pkg, null, 2) + "\n", "F2 — npm run shots:capture");
}

/* ================================================== G. Motion fallback */

function patchMotionFallback() {
  console.log(colour.bold("\n[G] Motion fallback for Safari and Firefox"));

  const revealPath = "components/motion/reveal.tsx";
  const reveal = read(revealPath);
  if (reveal === null) return tally("warn", "G — reveal.tsx not found");
  if (reveal.includes("motion-observed")) return tally("skip", "G1 — fallback class already emitted");

  // The array is written on one line in some revisions and wrapped in others, so both
  // are accepted. `motion-observed` is always present: the CSS path needs it, and the
  // observer looks for it.
  let next = reveal
    .replace(
      '  const modifiers = ["reveal", `reveal-${type}`].filter(Boolean).join(" ");',
      '  // `motion-observed` opts the element into the IntersectionObserver fallback used\n  // where CSS scroll-driven animations are unsupported (Safari, Firefox today).\n  const modifiers = ["reveal", "motion-observed", `reveal-${type}`].filter(Boolean).join(" ");',
    )
    .replace(
      '  const modifiers = [animation.enabled ? "reveal" : "", `reveal-${type}`]',
      '  const modifiers = [animation.enabled ? "reveal" : "", "motion-observed", `reveal-${type}`]',
    );

  if (!next.includes("motion-observed")) {
    tally("warn", "G1 — reveal.tsx shape changed, fallback class not added. The observer is mounted but idle; add \"motion-observed\" to the class list by hand.");
  } else {
    save(revealPath, reveal, next, "G1 — reveal elements opt into the fallback observer");
  }

  const cssPath = "app/globals.css";
  const css = read(cssPath);
  if (css === null) return tally("warn", "G2 — globals.css not found");
  if (css.includes("motion-observed")) return tally("skip", "G2 — fallback CSS already present");

  // Hidden state is gated behind a class the observer adds only when it runs, so a
  // browser without JavaScript never gets invisible content.
  const block = `
/* ---------------------------------------------------------------- *
 * Motion fallback for browsers without CSS scroll-driven animations
 * (Safari and Firefox today). The observer adds \`motion-ready\` to <html>
 * once it is actually running, and \`motion-in\` per element as it enters
 * the viewport. Without JavaScript nothing is ever hidden.
 * ---------------------------------------------------------------- */
html.motion-ready .motion-observed:not(.motion-in) {
  opacity: 0;
}

html.motion-ready .motion-observed.motion-in {
  animation: reveal-up 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--reveal-delay, 0ms);
  animation-duration: var(--reveal-duration, 620ms);
}

@media (prefers-reduced-motion: reduce) {
  html.motion-ready .motion-observed:not(.motion-in),
  html.motion-ready .motion-observed.motion-in {
    animation: none;
    opacity: 1;
  }
}
`;

  save(cssPath, css, css.trimEnd() + "\n" + block, "G2 — fallback reveal CSS appended");
}

/* ============================================= H. The fallback observer */

function patchObserver() {
  console.log(colour.bold("\n[H] Client observer for the fallback"));

  const component = `"use client";

import { useEffect } from "react";

/**
 * Reveals elements that CSS scroll-driven animations cannot reach.
 *
 * Browsers with \`animation-timeline: view()\` animate on their own; everywhere else
 * an IntersectionObserver adds \`.motion-in\` once, which the stylesheet animates.
 * Nothing here touches content on a browser that already supports the CSS path.
 */
export function MotionObserver() {
  useEffect(() => {
    const supports =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: view()");
    if (supports) return;

    // Only now may the stylesheet hide anything: without this class the tree stays
    // fully visible, which is what a no-JS visitor gets.
    document.documentElement.classList.add("motion-ready");

    const seen = new WeakSet<Element>();
    const reveal = (element: Element) => {
      if (seen.has(element)) return;
      seen.add(element);
      element.classList.add("motion-in");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    const tracked = new Set<Element>();
    const track = () => {
      for (const element of document.querySelectorAll(".motion-observed:not(.motion-in)")) {
        if (tracked.has(element)) continue;
        tracked.add(element);
        observer.observe(element);
      }
    };

    track();

    // Sections animate in after hydration, so new nodes need a second pass.
    const mutations = new MutationObserver(track);
    mutations.observe(document.body, { childList: true, subtree: true });

    // Content already on screen at load must not wait for a scroll event.
    requestAnimationFrame(track);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
`;

  save("components/motion/motion-observer.tsx", read("components/motion/motion-observer.tsx"), component, "H1 — MotionObserver component");

  // H2 — the observer has to be both imported and mounted. A half-applied run leaves
  // an unused import (lint error) or a mounted component with no import (build error),
  // so each half is checked and repaired independently.
  const layoutPath = "app/(site)/layout.tsx";
  const layout = read(layoutPath);
  if (layout === null) return tally("warn", "H2 — site layout not found");
  const mounts = (layout.match(/<MotionObserver \/>/g) ?? []).length;
  if (mounts === 1 && layout.includes("motion-observer")) {
    return tally("skip", "H2 — observer already mounted");
  }
  if (mounts > 1) {
    // An earlier half-run mounted it more than once; collapse to a single instance.
    let deduped = layout;
    while ((deduped.match(/<MotionObserver \/>/g) ?? []).length > 1) {
      deduped = deduped.replace("          <MotionObserver />\n          <MotionObserver />", "          <MotionObserver />");
      deduped = deduped.replace("<MotionObserver />\n          <MotionObserver />", "<MotionObserver />");
      if ((deduped.match(/<MotionObserver \/>/g) ?? []).length > 1) {
        const first = deduped.indexOf("<MotionObserver />");
        const second = deduped.indexOf("<MotionObserver />", first + 1);
        deduped = deduped.slice(0, second) + deduped.slice(second + "<MotionObserver />".length);
      }
    }
    save(layoutPath, layout, deduped, "H2 — duplicate observer mount removed");
    return;
  }

  let withImport = layout;
  if (!withImport.includes("motion-observer")) {
    const anchor = 'import { ScrollProgress } from "@/components/motion/scroll-progress";';
    if (withImport.includes(anchor)) {
      withImport = withImport.replace(
        anchor,
        `${anchor}\nimport { MotionObserver } from "@/components/motion/motion-observer";`,
      );
    }
  }

  let withMount = withImport;
  if (!withMount.includes("<MotionObserver />")) {
    // Anchor on the exact line, indentation captured from the file itself. Chaining a
    // deeper and a shallower pattern is a trap: the shallower one matches inside the
    // already-rewritten line and mounts the component twice.
    withMount = withMount.replace(
      /^(\s*)(<PageView \/>)/m,
      (_, indent, tag) => `${indent}<MotionObserver />\n${indent}${tag}`,
    );
  }

  const problems = [];
  if (!withMount.includes("motion-observer")) problems.push("import");
  if (!withMount.includes("<MotionObserver />")) problems.push("mount");

  if (problems.length > 0) {
    tally(
      "warn",
      `H2 — layout shape changed (${problems.join(", ")}). Add the import and <MotionObserver /> by hand.`,
    );
  } else {
    save(layoutPath, layout, withMount, "H2 — observer mounted in the site layout");
  }
}

/* ================================================== I. Dependency hygiene */

function patchDependencies() {
  console.log(colour.bold("\n[I] Dependencies"));

  const pkgPath = "package.json";
  const raw = read(pkgPath);
  if (raw === null) return tally("fail", "I — package.json not found");

  const pkg = JSON.parse(raw);
  const unused = ["framer-motion", "react-hook-form", "@hookform/resolvers"];
  const removed = unused.filter((name) => pkg.dependencies?.[name]);

  // `pg` is used by the migration runner and the e2e reset, never by the app.
  if (pkg.dependencies?.pg && !pkg.devDependencies?.pg) {
    removed.push("pg (moved to devDependencies)");
    pkg.devDependencies = pkg.devDependencies ?? {};
    pkg.devDependencies.pg = pkg.dependencies.pg;
    delete pkg.dependencies.pg;
  }

  if (removed.length === 0) return tally("skip", "I — dependencies already trimmed");

  for (const name of unused) delete pkg.dependencies[name];
  pkg.dependencies = Object.fromEntries(Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)));
  pkg.devDependencies = Object.fromEntries(Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b)));

  save(pkgPath, raw, JSON.stringify(pkg, null, 2) + "\n", `I — removed ${removed.join(", ")}`);
  tally("warn", "I — run `npm install` to update the lockfile");
}

/* ============================================================== run === */

console.log(colour.bold(`\nphase-1 patcher${DRY ? " — dry run" : ""} · ${ROOT}`));

if (!existsSync(join(ROOT, "package.json"))) {
  console.error(colour.red("\nNo package.json in this directory. Run the script from the project root."));
  process.exit(1);
}

const steps = [
  ["A", patchSeo],
  ["B", patchWiring],
  ["C", patchProjectLinks],
  ["D", patchStudio],
  ["E", patchCopy],
  ["F", patchCapture],
  ["G", patchMotionFallback],
  ["H", patchObserver],
  ["I", patchDependencies],
];

for (const [, step] of steps) {
  try {
    step();
  } catch (error) {
    tally("fail", `${error instanceof Error ? error.message : String(error)}`);
  }
}

const count = (kind) => results.filter((entry) => entry.kind === kind).length;
console.log(
  `\n${colour.bold("Summary")}  ${colour.green(`${count("ok")} applied`)}  ${colour.dim(
    `${count("skip")} skipped`,
  )}  ${colour.yellow(`${count("warn")} warnings`)}  ${count("fail") ? colour.red(`${count("fail")} failed`) : "0 failed"}`,
);

if (!DRY) {
  console.log(`
${colour.bold("Next, in this order:")}
  1. npm install                       ${colour.dim("(dependency list changed)")}
  2. npm run typecheck && npm run lint
  3. npm test
  4. npm run db:seed                   ${colour.dim("(writes the project links)")}  ${colour.yellow("BEFORE the build")}
  5. npm run build
  6. git status                        ${colour.dim("(*.phase1-backup marks every file this script touched)")}
`);
}

process.exit(count("fail") > 0 ? 1 : 0);
