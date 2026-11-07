import { getDb } from "@/lib/db/client";
import { rateLimitBuckets } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit({
  key,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  if (!process.env.DATABASE_URL) {
    const entry = memoryBuckets.get(key);
    if (!entry || entry.resetAt < now.getTime()) {
      memoryBuckets.set(key, { count: 1, resetAt: resetAt.getTime() });
      return { allowed: true, remaining: limit - 1, resetAt };
    }
    entry.count += 1;
    return {
      allowed: entry.count <= limit,
      remaining: Math.max(0, limit - entry.count),
      resetAt: new Date(entry.resetAt),
    };
  }

  const db = getDb();
  const [row] = await db
    .insert(rateLimitBuckets)
    .values({ key, count: 1, windowStart: now, expiresAt: resetAt })
    .onConflictDoUpdate({
      target: rateLimitBuckets.key,
      set: {
        count: sql`case when ${rateLimitBuckets.expiresAt} < now() then 1 else ${rateLimitBuckets.count} + 1 end`,
        windowStart: sql`case when ${rateLimitBuckets.expiresAt} < now() then now() else ${rateLimitBuckets.windowStart} end`,
        expiresAt: sql`case when ${rateLimitBuckets.expiresAt} < now() then ${resetAt.toISOString()}::timestamptz else ${rateLimitBuckets.expiresAt} end`,
      },
    })
    .returning({ count: rateLimitBuckets.count, expiresAt: rateLimitBuckets.expiresAt });

  if (!row) return { allowed: true, remaining: limit - 1, resetAt };

  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: row.expiresAt,
  };
}

