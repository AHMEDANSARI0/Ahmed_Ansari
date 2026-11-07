"use server";

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { sectionContent, sections, siteSettings } from "@/lib/db/schema";
import { runAction } from "@/lib/actions/result";
import { requireActionContext } from "@/lib/security/guard";
import { PERMISSIONS } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { bumpTags } from "@/lib/cache";
import { CONFIG_TAGS } from "@/lib/services/settings";
import { AppError } from "@/lib/errors";
import { sanitizeText } from "@/lib/security/sanitize";
import {
  animationUpdateSchema,
  contentFieldValueSchema,
  designUpdateSchema,
  portraitUpdateSchema,
  sectionContentSchema,
  sectionReorderSchema,
  sectionUpdateSchema,
} from "@/lib/validations/studio";

const CSRF_FIELD = "csrf-token";

function readCsrf(formData: FormData) {
  return String(formData.get(CSRF_FIELD) ?? "");
}

async function writeSetting(
  key: "design" | "animation" | "portrait",
  value: unknown,
  adminId: string,
) {
  const db = getDb();
  await db
    .insert(siteSettings)
    .values({ key, value: value as Record<string, unknown>, updatedBy: adminId })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: value as Record<string, unknown>, updatedBy: adminId, updatedAt: new Date() },
    });
}

export async function updateSectionAction(formData: FormData) {
  return runAction("studio.section.update", async () => {
    const context = await requireActionContext(PERMISSIONS.contentEdit, readCsrf(formData));
    const payload = sectionUpdateSchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));

    const db = getDb();
    const [existing] = await db
      .select({ id: sections.id, anchor: sections.anchor })
      .from(sections)
      .where(eq(sections.key, payload.key))
      .limit(1);

    if (!existing) throw new AppError("Section not found.", "NOT_FOUND", 404);

    if (payload.anchor !== existing.anchor) {
      const [clash] = await db
        .select({ key: sections.key })
        .from(sections)
        .where(eq(sections.anchor, payload.anchor))
        .limit(1);
      if (clash) throw new AppError(`Anchor #${payload.anchor} is already used by ${clash.key}.`, "CONFLICT", 409);
    }

    await db
      .update(sections)
      .set({
        label: payload.label,
        navLabel: payload.navLabel ?? null,
        anchor: payload.anchor,
        eyebrow: payload.eyebrow ? sanitizeText(payload.eyebrow) : null,
        heading: payload.heading ? sanitizeText(payload.heading) : null,
        description: payload.description ? sanitizeText(payload.description) : null,
        isVisible: payload.isVisible,
        showInNav: payload.showInNav,
        animationType: payload.animationType ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sections.key, payload.key));

    await recordAudit({
      adminId: context.session.id,
      action: "content.section-updated",
      entity: "sections",
      entityId: existing.id,
      summary: `Section "${payload.key}" updated`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.sections, CONFIG_TAGS.content);
    return { key: payload.key };
  });
}

export async function reorderSectionsAction(formData: FormData) {
  return runAction("studio.section.reorder", async () => {
    const context = await requireActionContext(PERMISSIONS.contentEdit, readCsrf(formData));
    const { order } = sectionReorderSchema.parse(
      JSON.parse(String(formData.get("payload") ?? "{}")),
    );

    const db = getDb();
    for (const [index, key] of order.entries()) {
      await db.update(sections).set({ position: index, updatedAt: new Date() }).where(eq(sections.key, key));
    }

    await recordAudit({
      adminId: context.session.id,
      action: "content.sections-reordered",
      entity: "sections",
      summary: `Section order: ${order.join(" > ")}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.sections, CONFIG_TAGS.content);
    return { order };
  });
}

export async function updateSectionContentAction(formData: FormData) {
  return runAction("studio.section.content", async () => {
    const context = await requireActionContext(PERMISSIONS.contentEdit, readCsrf(formData));
    const payload = sectionContentSchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));

    const db = getDb();
    const [section] = await db
      .select({ id: sections.id })
      .from(sections)
      .where(eq(sections.key, payload.key))
      .limit(1);

    if (!section) throw new AppError("Section not found.", "NOT_FOUND", 404);

    for (const [fieldKey, rawValue] of Object.entries(payload.fields)) {
      const value = contentFieldValueSchema.parse(rawValue);
      await db
        .insert(sectionContent)
        .values({ sectionId: section.id, fieldKey, value })
        .onConflictDoUpdate({
          target: [sectionContent.sectionId, sectionContent.fieldKey],
          set: { value, updatedAt: new Date() },
        });
    }

    await recordAudit({
      adminId: context.session.id,
      action: "content.section-content-updated",
      entity: "section_content",
      entityId: section.id,
      summary: `Fields saved for "${payload.key}": ${Object.keys(payload.fields).join(", ")}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.sections, CONFIG_TAGS.content);
    return { saved: Object.keys(payload.fields).length };
  });
}

export async function updateDesignAction(formData: FormData) {
  return runAction("studio.design", async () => {
    const context = await requireActionContext(PERMISSIONS.settingsManage, readCsrf(formData));
    const payload = designUpdateSchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));

    const fresh = await import("@/lib/services/settings").then((module) =>
      module.getDesignSettings(),
    );

    await writeSetting(
      "design",
      {
        ...fresh,
        ...payload,
        // Font stacks stay owner-controlled elsewhere; the studio only edits scale.
        typography: { ...fresh.typography, ...payload.typography },
      },
      context.session.id,
    );

    await recordAudit({
      adminId: context.session.id,
      action: "design.updated",
      entity: "site_settings",
      entityId: "design",
      summary: "Design tokens updated",
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.design);
    return { savedAt: new Date().toISOString() };
  });
}

export async function updateAnimationAction(formData: FormData) {
  return runAction("studio.animation", async () => {
    const context = await requireActionContext(PERMISSIONS.settingsManage, readCsrf(formData));
    const payload = animationUpdateSchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));

    await writeSetting("animation", payload, context.session.id);

    await recordAudit({
      adminId: context.session.id,
      action: "animation.updated",
      entity: "site_settings",
      entityId: "animation",
      summary: `Motion ${payload.enabled ? "enabled" : "disabled"}, duration ${payload.duration}s`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.animation);
    return { savedAt: new Date().toISOString() };
  });
}

export async function updatePortraitAction(formData: FormData) {
  return runAction("studio.portrait", async () => {
    const context = await requireActionContext(PERMISSIONS.settingsManage, readCsrf(formData));
    const payload = portraitUpdateSchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));

    await writeSetting("portrait", payload, context.session.id);

    await recordAudit({
      adminId: context.session.id,
      action: "portrait.updated",
      entity: "site_settings",
      entityId: "portrait",
      summary: `Portrait ${payload.mode}, density ${payload.desktop.density}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.portrait);
    return { savedAt: new Date().toISOString() };
  });
}

export async function resetSettingAction(formData: FormData) {
  return runAction("studio.reset", async () => {
    const context = await requireActionContext(PERMISSIONS.settingsManage, readCsrf(formData));
    const key = String(formData.get("key") ?? "");

    if (!["design", "animation", "portrait"].includes(key)) {
      throw new AppError("Unknown configuration block.", "VALIDATION");
    }

    const db = getDb();
    await db.delete(siteSettings).where(sql`${siteSettings.key} = ${key}`);

    await recordAudit({
      adminId: context.session.id,
      action: "settings.reset",
      entity: "site_settings",
      entityId: key,
      summary: `${key} configuration reset to defaults`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS[key as "design" | "animation" | "portrait"]);
    return { key };
  });
}
