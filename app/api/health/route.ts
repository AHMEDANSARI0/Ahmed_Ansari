import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { hasDatabase } from "@/lib/rsc-guard";

export const dynamic = "force-dynamic";

/**
 * Deployment probe. It answers 200 only when the app can actually read the
 * database, so an external monitor cannot be fooled by a booting instance.
 *
 * No secrets, no counts that could be scraped: just liveness and a timestamp.
 */
export async function GET() {
  const startedAt = Date.now();

  if (!hasDatabase()) {
    return NextResponse.json(
      { ok: false, database: "not configured" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json(
      {
        ok: true,
        database: "reachable",
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, database: "unreachable", checkedAt: new Date().toISOString() },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
