"use server";

import { and, asc, eq, gt, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { education } from "@/lib/db/schema";
import { runAction } from "@/lib/actions/result";
import { requireActionContext } from "@/lib/security/guard";
import { PERMISSIONS } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { bumpTags } from "@/lib/cache";
import { CONFIG_TAGS } from "@/lib/services/settings";
import { AppError } from "@/lib/errors";
import { sanitizeText } from "@/lib/security/sanitize";
import { educationEntrySchema, educationIdSchema } from "@/lib/validations/education";

const CSRF_FIELD = "csrf-token";

function readCsrf(formData: FormData) {
  return String(formData.get(CSRF_FIELD) ?? "");
}

function emptyToNull(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

async function nextPosition() {
  const db = getDb();
  const [row] = await db
    .select({ value: sql<number>`coalesce(max(${education.position}), -1)::int` })
    .from(education);
  return (row?.value ?? -1) + 1;
}

function valuesFrom(payload: ReturnType<typeof educationEntrySchema.parse>) {
  return {
    institution: sanitizeText(payload.institution),
    program: sanitizeText(payload.program),
    location: emptyToNull(payload.location),
    startYear: payload.startYear,
    endYear: emptyToNull(payload.endYear),
    summary: payload.summary ? sanitizeText(payload.summary) : null,
    isVisible: payload.isVisible,
  };
}

export async function createEducationAction(formData: FormData) {
  return runAction("education.create", async () => {
    const context = await requireActionContext(PERMISSIONS.contentEdit, readCsrf(formData));
    const payload = educationEntrySchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));

    const db = getDb();
    const [created] = await db
      .insert(education)
      .values({ ...valuesFrom(payload), position: await nextPosition() })
      .returning({ id: education.id });

    await recordAudit({
      adminId: context.session.id,
      action: "education.created",
      entity: "education",
      entityId: created?.id ?? null,
      summary: `Created ${payload.institution} — ${payload.program}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    return { id: created?.id ?? null };
  });
}

export async function updateEducationAction(formData: FormData) {
  return runAction("education.update", async () => {
    const context = await requireActionContext(PERMISSIONS.contentEdit, readCsrf(formData));
    const id = educationIdSchema.parse(String(formData.get("id") ?? ""));
    const payload = educationEntrySchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));

    const db = getDb();
    const [existing] = await db
      .select({ id: education.id })
      .from(education)
      .where(eq(education.id, id))
      .limit(1);

    if (!existing) throw new AppError("That education entry no longer exists.", "NOT_FOUND", 404);

    await db
      .update(education)
      .set({ ...valuesFrom(payload), updatedAt: new Date() })
      .where(eq(education.id, id));

    await recordAudit({
      adminId: context.session.id,
      action: "education.updated",
      entity: "education",
      entityId: id,
      summary: `Updated ${payload.institution} — ${payload.program}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    return { id };
  });
}

export async function deleteEducationAction(formData: FormData) {
  return runAction("education.delete", async () => {
    const context = await requireActionContext(PERMISSIONS.contentEdit, readCsrf(formData));
    const id = educationIdSchema.parse(String(formData.get("id") ?? ""));

    const db = getDb();
    const deleted = await db.delete(education).where(eq(education.id, id)).returning({
      institution: education.institution,
    });

    if (deleted.length === 0) {
      throw new AppError("That education entry no longer exists.", "NOT_FOUND", 404);
    }

    await recordAudit({
      adminId: context.session.id,
      action: "education.deleted",
      entity: "education",
      entityId: id,
      summary: `Deleted ${deleted[0]?.institution ?? "entry"}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    return { id };
  });
}

/**
 * Swaps the position with the neighbour above or below. Two rows are touched, so
 * the whole move runs as a single statement pair inside one transaction.
 */
export async function moveEducationAction(formData: FormData) {
  return runAction("education.move", async () => {
    const context = await requireActionContext(PERMISSIONS.contentEdit, readCsrf(formData));
    const id = educationIdSchema.parse(String(formData.get("id") ?? ""));
    const direction = String(formData.get("direction") ?? "up") === "down" ? "down" : "up";

    const db = getDb();
    const [current] = await db
      .select({ id: education.id, position: education.position })
      .from(education)
      .where(eq(education.id, id))
      .limit(1);

    if (!current) throw new AppError("That education entry no longer exists.", "NOT_FOUND", 404);

    const [neighbour] = await db
      .select({ id: education.id, position: education.position })
      .from(education)
      .where(
        direction === "up"
          ? and(lt(education.position, current.position))
          : and(gt(education.position, current.position)),
      )
      .orderBy(direction === "up" ? sql`${education.position} desc` : asc(education.position))
      .limit(1);

    // Already at the edge: nothing to do, and no audit noise.
    if (!neighbour) return { moved: false };

    await db.transaction(async (tx) => {
      await tx
        .update(education)
        .set({ position: neighbour.position, updatedAt: new Date() })
        .where(eq(education.id, current.id));
      await tx
        .update(education)
        .set({ position: current.position, updatedAt: new Date() })
        .where(eq(education.id, neighbour.id));
    });

    await recordAudit({
      adminId: context.session.id,
      action: "education.reordered",
      entity: "education",
      entityId: id,
      summary: `Moved entry ${direction}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    return { moved: true };
  });
}
