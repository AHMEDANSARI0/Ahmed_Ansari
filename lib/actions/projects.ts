"use server";

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  contentVersions,
  projectImages,
  projectTechnologies,
  projects,
  technologies,
} from "@/lib/db/schema";
import { runAction } from "@/lib/actions/result";
import { requireActionContext } from "@/lib/security/guard";
import { PERMISSIONS } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { bumpPaths, bumpTags } from "@/lib/cache";
import { CONFIG_TAGS } from "@/lib/services/settings";
import { AppError } from "@/lib/errors";
import { sanitizeText } from "@/lib/security/sanitize";
import { projectFormSchema, projectStatusUpdateSchema } from "@/lib/validations/project";

const CSRF_FIELD = "csrf-token";

function readCsrf(formData: FormData) {
  return String(formData.get(CSRF_FIELD) ?? "");
}

function emptyToNull(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

async function snapshot(entityId: string, data: unknown, adminId: string) {
  const db = getDb();
  const [row] = await db
    .select({ version: sql<number>`coalesce(max(${contentVersions.version}), 0)::int` })
    .from(contentVersions)
    .where(eq(contentVersions.entityId, entityId));

  await db.insert(contentVersions).values({
    entity: "projects",
    entityId,
    version: (row?.version ?? 0) + 1,
    snapshot: data as Record<string, unknown>,
    createdBy: adminId,
  });
}

export async function createProjectAction(formData: FormData) {
  return runAction("projects.create", async () => {
    const context = await requireActionContext(PERMISSIONS.projectsManage, readCsrf(formData));
    const payload = projectFormSchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));

    const db = getDb();
    const [clash] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, payload.slug))
      .limit(1);

    if (clash) throw new AppError(`A project already uses the slug "${payload.slug}".`, "CONFLICT", 409);

    const [max] = await db.select({ position: sql<number>`coalesce(max(${projects.position}), 0)::int` }).from(projects);

    const [created] = await db
      .insert(projects)
      .values({
        slug: payload.slug,
        title: sanitizeText(payload.title),
        shortDescription: sanitizeText(payload.shortDescription),
        fullDescription: sanitizeText(payload.fullDescription),
        problem: emptyToNull(payload.problem && sanitizeText(payload.problem)),
        architecture: emptyToNull(payload.architecture && sanitizeText(payload.architecture)),
        solution: emptyToNull(payload.solution && sanitizeText(payload.solution)),
        outcome: emptyToNull(payload.outcome && sanitizeText(payload.outcome)),
        features: payload.features,
        stage: payload.stage,
        status: payload.status,
        isFeatured: payload.isFeatured,
        position: (max?.position ?? 0) + 1,
        coverImageUrl: emptyToNull(payload.coverImageUrl),
        architectureImageUrl: emptyToNull(payload.architectureImageUrl),
        demoUrl: emptyToNull(payload.demoUrl),
        repoUrl: emptyToNull(payload.repoUrl),
        seoTitle: emptyToNull(payload.seoTitle),
        seoDescription: emptyToNull(payload.seoDescription),
        publishedAt: payload.status === "published" ? new Date() : null,
      })
      .returning({ id: projects.id, slug: projects.slug });

    if (!created) throw new AppError("Project could not be created.", "INTERNAL", 500);

    await syncRelations(created.id, payload.technologyIds, payload.gallery);
    await snapshot(created.id, payload, context.session.id);

    await recordAudit({
      adminId: context.session.id,
      action: "projects.created",
      entity: "projects",
      entityId: created.id,
      summary: `Created ${payload.title}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    bumpPaths(`/work/${created.slug}`);
    return { id: created.id, slug: created.slug };
  });
}

export async function updateProjectAction(formData: FormData) {
  return runAction("projects.update", async () => {
    const context = await requireActionContext(PERMISSIONS.projectsManage, readCsrf(formData));
    const id = String(formData.get("id") ?? "");
    if (!id) throw new AppError("Missing project id.", "VALIDATION");

    const payload = projectFormSchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));
    const db = getDb();

    const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!existing) throw new AppError("Project not found.", "NOT_FOUND", 404);

    if (payload.slug !== existing.slug) {
      const [clash] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, payload.slug))
        .limit(1);
      if (clash && clash.id !== id) {
        throw new AppError(`The slug "${payload.slug}" is already taken.`, "CONFLICT", 409);
      }
    }

    await db
      .update(projects)
      .set({
        slug: payload.slug,
        title: sanitizeText(payload.title),
        shortDescription: sanitizeText(payload.shortDescription),
        fullDescription: sanitizeText(payload.fullDescription),
        problem: emptyToNull(payload.problem && sanitizeText(payload.problem)),
        architecture: emptyToNull(payload.architecture && sanitizeText(payload.architecture)),
        solution: emptyToNull(payload.solution && sanitizeText(payload.solution)),
        outcome: emptyToNull(payload.outcome && sanitizeText(payload.outcome)),
        features: payload.features,
        stage: payload.stage,
        status: payload.status,
        isFeatured: payload.isFeatured,
        coverImageUrl: emptyToNull(payload.coverImageUrl),
        architectureImageUrl: emptyToNull(payload.architectureImageUrl),
        demoUrl: emptyToNull(payload.demoUrl),
        repoUrl: emptyToNull(payload.repoUrl),
        seoTitle: emptyToNull(payload.seoTitle),
        seoDescription: emptyToNull(payload.seoDescription),
        publishedAt:
          payload.status === "published" ? existing.publishedAt ?? new Date() : existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id));

    await syncRelations(id, payload.technologyIds, payload.gallery);
    await snapshot(id, payload, context.session.id);

    await recordAudit({
      adminId: context.session.id,
      action: "projects.updated",
      entity: "projects",
      entityId: id,
      summary: `Updated ${payload.title}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    bumpPaths(`/work/${payload.slug}`, `/work/${existing.slug}`);
    return { id, slug: payload.slug };
  });
}

async function syncRelations(
  projectId: string,
  technologyIds: string[],
  gallery: { url: string; alt: string; caption?: string }[],
) {
  const db = getDb();

  await db.delete(projectTechnologies).where(eq(projectTechnologies.projectId, projectId));
  if (technologyIds.length > 0) {
    const valid = await db.select({ id: technologies.id }).from(technologies);
    const allowed = new Set(valid.map((row) => row.id));
    const rows = technologyIds
      .filter((id) => allowed.has(id))
      .map((technologyId) => ({ projectId, technologyId }));
    if (rows.length > 0) await db.insert(projectTechnologies).values(rows);
  }

  await db.delete(projectImages).where(eq(projectImages.projectId, projectId));
  if (gallery.length > 0) {
    await db.insert(projectImages).values(
      gallery.map((image, index) => ({
        projectId,
        url: image.url,
        alt: sanitizeText(image.alt),
        caption: emptyToNull(image.caption && sanitizeText(image.caption)),
        position: index,
      })),
    );
  }
}

export async function setProjectStatusAction(formData: FormData) {
  return runAction("projects.status", async () => {
    const context = await requireActionContext(PERMISSIONS.contentPublish, readCsrf(formData));
    const payload = projectStatusUpdateSchema.parse(
      JSON.parse(String(formData.get("payload") ?? "{}")),
    );

    const db = getDb();
    const [existing] = await db
      .select({
        id: projects.id,
        slug: projects.slug,
        publishedAt: projects.publishedAt,
        title: projects.title,
      })
      .from(projects)
      .where(eq(projects.id, payload.id))
      .limit(1);

    if (!existing) throw new AppError("Project not found.", "NOT_FOUND", 404);

    await db
      .update(projects)
      .set({
        status: payload.status,
        publishedAt:
          payload.status === "published" ? existing.publishedAt ?? new Date() : existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, payload.id));

    await recordAudit({
      adminId: context.session.id,
      action: "projects.status",
      entity: "projects",
      entityId: payload.id,
      summary: `${existing.title} -> ${payload.status}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    bumpPaths(`/work/${existing.slug}`);
    return { id: payload.id, status: payload.status };
  });
}

export async function reorderProjectsAction(formData: FormData) {
  return runAction("projects.reorder", async () => {
    const context = await requireActionContext(PERMISSIONS.projectsManage, readCsrf(formData));
    const order = JSON.parse(String(formData.get("payload") ?? "[]")) as string[];
    if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
      throw new AppError("Invalid order payload.", "VALIDATION");
    }

    const db = getDb();
    for (const [index, id] of order.entries()) {
      await db.update(projects).set({ position: index, updatedAt: new Date() }).where(eq(projects.id, id));
    }

    await recordAudit({
      adminId: context.session.id,
      action: "projects.reordered",
      entity: "projects",
      summary: `${order.length} projects reordered`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    return { count: order.length };
  });
}

export async function deleteProjectAction(formData: FormData) {
  return runAction("projects.delete", async () => {
    const context = await requireActionContext(PERMISSIONS.projectsManage, readCsrf(formData));
    const id = String(formData.get("id") ?? "");
    if (!id) throw new AppError("Missing project id.", "VALIDATION");

    const db = getDb();
    const [existing] = await db
      .select({ title: projects.title, slug: projects.slug })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!existing) throw new AppError("Project not found.", "NOT_FOUND", 404);

    await db.delete(projects).where(eq(projects.id, id));

    await recordAudit({
      adminId: context.session.id,
      action: "projects.deleted",
      entity: "projects",
      entityId: id,
      summary: `Deleted ${existing.title}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    bumpPaths(`/work/${existing.slug}`);
    return { id };
  });
}
