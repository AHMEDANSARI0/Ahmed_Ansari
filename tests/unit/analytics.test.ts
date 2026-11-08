import { describe, expect, it } from "vitest";
import {
  deviceCategory,
  isAutomatedUserAgent,
  isExcluded,
  referrerHost,
  visitorHashes,
} from "@/lib/analytics/visitor";
import type { ExcludedVisitor } from "@/lib/config/site";

const chrome =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function entry(overrides: Partial<ExcludedVisitor> = {}): ExcludedVisitor {
  return {
    hash: "a".repeat(24),
    label: "My browser",
    createdAt: "2026-11-08T10:00:00.000Z",
    kind: "browser",
    ...overrides,
  };
}

describe("visitor hashing", () => {
  it("rotates the daily hash when the day changes", () => {
    const first = visitorHashes({ ip: "1.2.3.4", userAgent: chrome, day: "2026-11-08" });
    const second = visitorHashes({ ip: "1.2.3.4", userAgent: chrome, day: "2026-11-09" });
    expect(first.daily).not.toBe(second.daily);
  });

  it("keeps the browser hash stable across days", () => {
    const first = visitorHashes({ ip: "1.2.3.4", userAgent: chrome, browserId: "abc", day: "2026-11-08" });
    const second = visitorHashes({ ip: "9.9.9.9", userAgent: chrome, browserId: "abc", day: "2026-11-09" });
    expect(first.browser).toBe(second.browser);
  });

  it("has no browser hash when local storage is blocked", () => {
    const hashes = visitorHashes({ ip: "1.2.3.4", userAgent: chrome, browserId: null, day: "2026-11-08" });
    expect(hashes.browser).toBeNull();
  });

  it("never stores a full digest", () => {
    const hashes = visitorHashes({ ip: "1.2.3.4", userAgent: chrome, day: "2026-11-08" });
    expect(hashes.daily).toHaveLength(24);
    expect(hashes.daily).toMatch(/^[0-9a-f]+$/);
  });
});

describe("exclusion matching", () => {
  const hashes = visitorHashes({
    ip: "1.2.3.4",
    userAgent: chrome,
    browserId: "browser-uuid",
    day: "2026-11-08",
  });

  it("matches the daily hash", () => {
    expect(isExcluded(hashes, [entry({ hash: hashes.daily, kind: "daily" })])?.kind).toBe("daily");
  });

  it("matches the browser hash", () => {
    expect(isExcluded(hashes, [entry({ hash: hashes.browser as string })])?.label).toBe("My browser");
  });

  it("does not match an unrelated hash", () => {
    expect(isExcluded(hashes, [entry({ hash: "f".repeat(24) })])).toBeNull();
  });

  it("treats a missing list as counting everything", () => {
    expect(isExcluded(hashes, undefined)).toBeNull();
    expect(isExcluded(hashes, [])).toBeNull();
  });
});

describe("automated traffic", () => {
  it("accepts a real browser", () => {
    expect(isAutomatedUserAgent(chrome)).toBe(false);
  });

  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "curl/8.4.0",
    "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
    "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0.0.0",
    "UptimeRobot/2.0",
    "python-requests/2.31.0",
  ])("drops %s", (agent) => {
    expect(isAutomatedUserAgent(agent)).toBe(true);
  });

  it("drops an empty user agent", () => {
    expect(isAutomatedUserAgent("")).toBe(true);
    expect(isAutomatedUserAgent(null)).toBe(true);
  });
});

describe("normalisation helpers", () => {
  it("buckets viewports into device categories", () => {
    expect(deviceCategory(390)).toBe("mobile");
    expect(deviceCategory(820)).toBe("tablet");
    expect(deviceCategory(1440)).toBe("desktop");
    expect(deviceCategory(undefined)).toBe("unknown");
  });

  it("keeps only the referrer host", () => {
    expect(referrerHost("https://www.google.com/search?q=portfolio")).toBe("google.com");
    expect(referrerHost("not a url")).toBeNull();
    expect(referrerHost(null)).toBeNull();
  });
});
