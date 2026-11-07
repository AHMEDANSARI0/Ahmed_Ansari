import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { projectImages, projectTechnologies, projects, technologies } from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";

export type AdminProjectRow = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  status: string;
  stage: string;
  isFeatured: boolean;
  position: number;
  updatedAt: Date;
  publishedAt: Date | null;
  technologyNames: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  coverImageUrl: string | null;
};

export async function listAdminProjects(): Promise<AdminProjectRow[]> {
  if (!hasDatabase()) return [];

  const db = getDb();
  const rows = await db.select().from(projects).orderBy(asc(projects.position), desc(projects.createdAt));
  const links = await db
    .select({ projectId: projectTechnologies.projectId, name: technologies.name })
    .from(projectTechnologies)
    .innerJoin(technologies, eq(technologies.id, projectTechnologies.technologyId));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.shortDescription,
    status: row.status,
    stage: row.stage,
    isFeatured: row.isFeatured,
    position: row.position,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    technologyNames: links.filter((link) => link.projectId === row.id).map((link) => link.name),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    coverImageUrl: row.coverImageUrl,
  }));
}

export async function getAdminProject(id: string) {
  if (!hasDatabase()) return null;

  const db = getDb();
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!row) return null;

  const [techRows, imageRows] = await Promise.all([
    db
      .select({ technologyId: projectTechnologies.technologyId })
      .from(projectTechnologies)
      .where(eq(projectTechnologies.projectId, id)),
    db.select().from(projectImages).where(eq(projectImages.projectId, id)).orderBy(asc(projectImages.position)),
  ]);

  return {
    ...row,
    features: (row.features as string[]) ?? [],
    technologyIds: techRows.map((entry) => entry.technologyId),
    gallery: imageRows.map((image) => ({
      url: image.url,
      alt: image.alt,
      caption: image.caption ?? "",
    })),
  };
}

export async function listTechnologies() {
  if (!hasDatabase()) return [];
  const db = getDb();
  return db
    .select({ id: technologies.id, name: technologies.name })
    .from(technologies)
    .orderBy(asc(technologies.position), asc(technologies.name));
}
