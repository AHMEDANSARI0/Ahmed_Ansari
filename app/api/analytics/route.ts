import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db/client";
import { analyticsEvents } from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";
import { rateLimit } from "@/lib/security/rate-limit";
import { getSiteSettingsFresh } from "@/lib/services/settings";
import {
  deviceCategory,
  isAutomatedUserAgent,
  isExcluded,
  referrerHost,
  visitorHashes,
} from "@/lib/analytics/visitor";
import { browserIdSchema } from "@/lib/validations/analytics";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  path: z.string().max(255),
  referrer: z.string().max(400).optional().nullable(),
  viewport: z.number().int().min(200).max(8000).optional(),
  browserId: z.string().max(64).optional().nullable(),
});

/**
 * First-party page-view beacon.
 *
 * Nothing here identifies a person: no cookies are set, no IP is stored, and the
 * visitor hash rotates daily. Bots and headless clients are accepted and then
 * dropped, and the owner's own browser is dropped through the exclusion list.
 */
export async function POST(request: Request) {
  if (!hasDatabase()) return NextResponse.json({ ok: false }, { status: 503 });

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = headerList.get("user-agent") ?? "";
  const country = headerList.get("x-vercel-ip-country")?.slice(0, 2) ?? null;

  const limit = await rateLimit({ key: `analytics:${ip}`, limit: 60, windowSeconds: 60 });
  if (!limit.allowed) return NextResponse.json({ ok: false }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  // Accepted, never written: the beacon should not see an error just because the
  // client is a crawler, an uptime probe or a headless browser.
  if (isAutomatedUserAgent(userAgent)) {
    return NextResponse.json({ ok: true, ignored: "automated" }, { headers: { "cache-control": "no-store" } });
  }

  const browserId = parsed.data.browserId
    ? (browserIdSchema.safeParse(parsed.data.browserId).data ?? null)
    : null;

  const day = new Date().toISOString().slice(0, 10);
  const hashes = visitorHashes({ ip, userAgent, browserId, day });

  const settings = await getSiteSettingsFresh();
  const exclusion = isExcluded(hashes, settings.analytics?.excludedVisitors);
  if (exclusion) {
    return NextResponse.json(
      { ok: true, ignored: "excluded", label: exclusion.label },
      { headers: { "cache-control": "no-store" } },
    );
  }

  try {
    await getDb().insert(analyticsEvents).values({
      eventType: "page_view",
      path: parsed.data.path.slice(0, 255),
      referrerHost: referrerHost(parsed.data.referrer),
      deviceCategory: deviceCategory(parsed.data.viewport),
      country,
      visitorHash: hashes.daily,
      metadata: {
        viewport: parsed.data.viewport ?? null,
        // Recorded so the dashboard can explain an exclusion added later. It is a
        // hash of a random browser id, not an identity.
        browserHash: hashes.browser,
      },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
