import { desc, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  auditLogs,
  contactInquiries,
  mediaAssets,
  projects,
  services,
  technologies,
} from "@/lib/db/schema";

export type DashboardStats = {
  totalProjects: number;
  publishedProjects: number;
  draftProjects: number;
  featuredProjects: number;
  totalInquiries: number;
  unreadInquiries: number;
  newInquiries: number;
  mediaCount: number;
  serviceCount: number;
  technologyCount: number;
};

export async function getDashboardStats(): Promise<DashboardStats | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    const db = getDb();
    const [projectCounts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        published: sql<number>`count(*) filter (where ${projects.status} = 'published')::int`,
        draft: sql<number>`count(*) filter (where ${projects.status} = 'draft')::int`,
        featured: sql<number>`count(*) filter (where ${projects.isFeatured})::int`,
      })
      .from(projects);

    const [inquiryCounts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        unread: sql<number>`count(*) filter (where ${contactInquiries.isRead} = false)::int`,
        fresh: sql<number>`count(*) filter (where ${contactInquiries.status} = 'new')::int`,
      })
      .from(contactInquiries);

    const [counts] = await db
      .select({
        media: sql<number>`(select count(*) from ${mediaAssets})::int`,
        services: sql<number>`(select count(*) from ${services})::int`,
        technologies: sql<number>`(select count(*) from ${technologies})::int`,
      })
      .from(sql`(select 1) as t`);

    return {
      totalProjects: projectCounts?.total ?? 0,
      publishedProjects: projectCounts?.published ?? 0,
      draftProjects: projectCounts?.draft ?? 0,
      featuredProjects: projectCounts?.featured ?? 0,
      totalInquiries: inquiryCounts?.total ?? 0,
      unreadInquiries: inquiryCounts?.unread ?? 0,
      newInquiries: inquiryCounts?.fresh ?? 0,
      mediaCount: counts?.media ?? 0,
      serviceCount: counts?.services ?? 0,
      technologyCount: counts?.technologies ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getRecentInquiries(limit = 5) {
  if (!process.env.DATABASE_URL) return [];
  try {
    const db = getDb();
    return await db
      .select({
        id: contactInquiries.id,
        name: contactInquiries.name,
        email: contactInquiries.email,
        company: contactInquiries.company,
        projectType: contactInquiries.projectType,
        status: contactInquiries.status,
        isRead: contactInquiries.isRead,
        createdAt: contactInquiries.createdAt,
      })
      .from(contactInquiries)
      .orderBy(desc(contactInquiries.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function getRecentActivity(limit = 8) {
  if (!process.env.DATABASE_URL) return [];
  try {
    const db = getDb();
    return await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        summary: auditLogs.summary,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}
