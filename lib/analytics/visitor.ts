import { createHash } from "node:crypto";
import type { ExcludedVisitor } from "@/lib/config/site";

export type VisitorInput = {
  ip: string;
  userAgent: string;
  browserId?: string | null;
  /** ISO date, `YYYY-MM-DD`. Rotating the day rotates the hash. */
  day: string;
};

export type VisitorHashes = {
  /** Rotates every day: cross-day tracking is impossible by construction. */
  daily: string;
  /** Stable per browser id: lets the owner exclude themselves immediately. */
  browser: string | null;
};

const HASH_LENGTH = 24;

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, HASH_LENGTH);
}

export function visitorHashes({ ip, userAgent, browserId, day }: VisitorInput): VisitorHashes {
  return {
    daily: sha(`${day}|${ip}|${userAgent}`),
    browser: browserId ? sha(`browser|${browserId}`) : null,
  };
}

/**
 * Two hashes are checked, so an exclusion holds as soon as it is added even
 * though the daily hash rotates at midnight UTC.
 */
export function isExcluded(
  hashes: VisitorHashes,
  exclusions: ExcludedVisitor[] | undefined | null,
): ExcludedVisitor | null {
  if (!exclusions || exclusions.length === 0) return null;
  const candidates = new Set([hashes.daily, hashes.browser].filter(Boolean) as string[]);
  return exclusions.find((entry) => candidates.has(entry.hash)) ?? null;
}

const BOT_PATTERN =
  /bot\b|bot\/|crawler|spider|headless|crawl|slurp|bingpreview|facebookexternalhit|embedly|preview|monitor|uptime|pingdom|curl\/|wget|python-requests|axios|node-fetch|go-http-client|java\/|lighthouse|pagespeed|gtmetrix|photon\/|semrush|ahrefs|screaming|validator|scrapy/i;

/**
 * Anything that does not look like a real browser is accepted (so the beacon
 * never errors) and then dropped before it reaches the counters.
 */
export function isAutomatedUserAgent(userAgent: string | null | undefined) {
  if (!userAgent || userAgent.trim().length === 0) return true;
  if (BOT_PATTERN.test(userAgent)) return true;
  // Real browsers all announce a rendering engine; scripted clients do not.
  return !/(mozilla|gecko|webkit|opera|edg|chrome|safari|firefox)/i.test(userAgent);
}

export function deviceCategory(viewport: number | undefined) {
  if (!viewport) return "unknown";
  if (viewport < 640) return "mobile";
  if (viewport < 1024) return "tablet";
  return "desktop";
}

export function referrerHost(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).host.replace(/^www\./, "").slice(0, 120);
  } catch {
    return null;
  }
}
