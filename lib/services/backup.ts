import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  animationSettings,
  backgroundSettings,
  projects,
  sections,
  sectionContent,
  services,
  siteSettings,
  skills,
  skillCategories,
  technologies,
  themeSettings,
} from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";

export type ContentBackup = {
  version: 1;
  exportedAt: string;
  counts: Record<string, number>;
  data: {
    siteSettings: unknown[];
    theme: unknown[];
    background: unknown[];
    animation: unknown[];
    sections: unknown[];
    sectionContent: unknown[];
    projects: unknown[];
    services: unknown[];
    skillCategories: unknown[];
    skills: unknown[];
    technologies: unknown[];
  };
};

export async function buildContentBackup(): Promise<ContentBackup> {
  const exportedAt = new Date().toISOString();

  if (!hasDatabase()) {
    return {
      version: 1,
      exportedAt,
      counts: {},
      data: {
        siteSettings: [],
        theme: [],
        background: [],
        animation: [],
        sections: [],
        sectionContent: [],
        projects: [],
        services: [],
        skillCategories: [],
        skills: [],
        technologies: [],
      },
    };
  }

  const db = getDb();
  const [
    siteRows,
    themeRows,
    backgroundRows,
    animationRows,
    sectionRows,
    contentRows,
    projectRows,
    serviceRows,
    categoryRows,
    skillRows,
    techRows,
  ] = await Promise.all([
    db.select().from(siteSettings),
    db.select().from(themeSettings),
    db.select().from(backgroundSettings),
    db.select().from(animationSettings),
    db.select().from(sections),
    db.select().from(sectionContent),
    db.select().from(projects),
    db.select().from(services),
    db.select().from(skillCategories),
    db.select().from(skills),
    db.select().from(technologies),
  ]);

  const data = {
    siteSettings: siteRows,
    theme: themeRows,
    background: backgroundRows,
    animation: animationRows,
    sections: sectionRows,
    sectionContent: contentRows,
    projects: projectRows,
    services: serviceRows,
    skillCategories: categoryRows,
    skills: skillRows,
    technologies: techRows,
  };

  return {
    version: 1,
    exportedAt,
    counts: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])),
    data,
  };
}

export async function tableSize() {
  if (!hasDatabase()) return 0;
  const db = getDb();
  const [row] = await db
    .select({ bytes: sql<number>`pg_database_size(current_database())::bigint` })
    .from(sql`(select 1) as t`);
  return Number(row?.bytes ?? 0);
}
