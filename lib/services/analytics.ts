import { and, desc, gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { analyticsEvents } from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";

export type AnalyticsWindow = 7 | 30 | 90;

export type AnalyticsSummary = {
  views: number;
  visitors: number;
  byDay: { day: string; views: number; visitors: number }[];
  topPaths: { path: string; views: number }[];
  referrers: { host: string; views: number }[];
  devices: { category: string; views: number }[];
  configured: boolean;
};

function since(days: AnalyticsWindow) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date;
}

export async function getAnalyticsSummary(days: AnalyticsWindow = 30): Promise<AnalyticsSummary> {
  const empty: AnalyticsSummary = {
    views: 0,
    visitors: 0,
    byDay: [],
    topPaths: [],
    referrers: [],
    devices: [],
    configured: false,
  };

  if (!hasDatabase()) return empty;

  try {
    const db = getDb();
    const from = since(days);
    const where = and(gte(analyticsEvents.createdAt, from), sql`${analyticsEvents.eventType} = 'page_view'`);

    const [totals] = await db
      .select({
        views: sql<number>`count(*)::int`,
        visitors: sql<number>`count(distinct ${analyticsEvents.visitorHash})::int`,
      })
      .from(analyticsEvents)
      .where(where);

    const byDay = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${analyticsEvents.createdAt}), 'YYYY-MM-DD')`,
        views: sql<number>`count(*)::int`,
        visitors: sql<number>`count(distinct ${analyticsEvents.visitorHash})::int`,
      })
      .from(analyticsEvents)
      .where(where)
      .groupBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`)
      .orderBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`);

    const topPaths = await db
      .select({ path: sql<string>`coalesce(${analyticsEvents.path}, '/')`, views: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(where)
      .groupBy(analyticsEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(8);

    const referrers = await db
      .select({
        host: sql<string>`coalesce(${analyticsEvents.referrerHost}, 'direct')`,
        views: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(where)
      .groupBy(analyticsEvents.referrerHost)
      .orderBy(desc(sql`count(*)`))
      .limit(6);

    const devices = await db
      .select({
        category: sql<string>`coalesce(${analyticsEvents.deviceCategory}, 'unknown')`,
        views: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(where)
      .groupBy(analyticsEvents.deviceCategory)
      .orderBy(desc(sql`count(*)`));

    return {
      views: totals?.views ?? 0,
      visitors: totals?.visitors ?? 0,
      byDay,
      topPaths,
      referrers,
      devices,
      configured: true,
    };
  } catch {
    return empty;
  }
}
