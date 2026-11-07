import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  projectImages,
  projectTechnologies,
  projects,
  technologies,
} from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";

export type ProjectDetail = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  problem: string | null;
  solution: string | null;
  architecture: string | null;
  outcome: string | null;
  features: string[];
  stage: string;
  coverImageUrl: string | null;
  architectureImageUrl: string | null;
  demoUrl: string | null;
  repoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  technologies: string[];
  gallery: { url: string; alt: string; caption: string | null }[];
};

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  if (!hasDatabase()) return null;

  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
      .limit(1);

    if (!row) return null;

    const [techRows, imageRows] = await Promise.all([
      db
        .select({ name: technologies.name })
        .from(projectTechnologies)
        .innerJoin(technologies, eq(technologies.id, projectTechnologies.technologyId))
        .where(eq(projectTechnologies.projectId, row.id))
        .orderBy(asc(technologies.position)),
      db
        .select()
        .from(projectImages)
        .where(eq(projectImages.projectId, row.id))
        .orderBy(asc(projectImages.position)),
    ]);

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      shortDescription: row.shortDescription,
      fullDescription: row.fullDescription.replace(/\s*\[REVIEW\]/g, "").trim(),
      problem: row.problem?.replace(/\s*\[REVIEW\]/g, "").trim() ?? null,
      solution: row.solution?.replace(/\s*\[REVIEW\]/g, "").trim() ?? null,
      architecture: row.architecture?.replace(/\s*\[REVIEW\]/g, "").trim() ?? null,
      outcome: row.outcome?.replace(/\s*\[REVIEW\]/g, "").trim() ?? null,
      features: (row.features as string[]) ?? [],
      stage: row.stage,
      coverImageUrl: row.coverImageUrl,
      architectureImageUrl: row.architectureImageUrl,
      demoUrl: row.demoUrl,
      repoUrl: row.repoUrl,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      publishedAt: row.publishedAt,
      technologies: techRows.map((tech) => tech.name),
      gallery: imageRows.map((image) => ({ url: image.url, alt: image.alt, caption: image.caption })),
    };
  } catch {
    return null;
  }
}

export async function getAllProjectSlugs() {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db
      .select({ slug: projects.slug })
      .from(projects)
      .where(eq(projects.status, "published"));
    return rows.map((row) => row.slug);
  } catch {
    return [];
  }
}
