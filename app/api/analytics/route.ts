import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getDb } from "@/lib/db/client";
import { analyticsEvents } from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";
import { rateLimit } from "@/lib/security/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  path: z.string().max(255),
  referrer: z.string().max(400).optional().nullable(),
  viewport: z.number().int().min(200).max(8000).optional(),
});

function deviceCategory(viewport: number | undefined) {
  if (!viewport) return "unknown";
  if (viewport < 640) return "mobile";
  if (viewport < 1024) return "tablet";
  return "desktop";
}

function referrerHost(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).host.replace(/^www\./, "").slice(0, 120);
  } catch {
    return null;
  }
}

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

  // No cookies, no raw IPs: a daily rotating hash gives a visitor count without tracking.
  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = createHash("sha256")
    .update(`${day}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);

  try {
    await getDb().insert(analyticsEvents).values({
      eventType: "page_view",
      path: parsed.data.path.slice(0, 255),
      referrerHost: referrerHost(parsed.data.referrer),
      deviceCategory: deviceCategory(parsed.data.viewport),
      country,
      visitorHash,
      metadata: { viewport: parsed.data.viewport ?? null },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
