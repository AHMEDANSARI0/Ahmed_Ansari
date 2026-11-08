"use server";

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/lib/db/client";
import { siteSettings } from "@/lib/db/schema";
import { runAction } from "@/lib/actions/result";
import { requireActionContext } from "@/lib/security/guard";
import { PERMISSIONS } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { bumpTags } from "@/lib/cache";
import { CONFIG_TAGS } from "@/lib/services/settings";
import { AppError } from "@/lib/errors";
import { excludedVisitorSchema } from "@/lib/validations/analytics";
import { defaultAnalyticsSettings, type ExcludedVisitor } from "@/lib/config/site";

const CSRF_FIELD = "csrf-token";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

async function readCurrent() {
  const db = getDb();
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, "global"))
    .limit(1);

  const value = (row?.value ?? {}) as Record<string, unknown>;
  const analytics = (value.analytics ?? {}) as { excludedVisitors?: ExcludedVisitor[] };
  return { value, list: analytics.excludedVisitors ?? defaultAnalyticsSettings.excludedVisitors };
}

async function writeList(
  next: ExcludedVisitor[],
  adminId: string,
  context: Record<string, unknown>,
) {
  const db = getDb();
  const { value } = await readCurrent();
  const merged = { ...value, analytics: { ...(value.analytics as object), excludedVisitors: next } };

  await db
    .insert(siteSettings)
    .values({ key: "global", value: merged, updatedBy: adminId })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: merged, updatedBy: adminId, updatedAt: new Date() },
    });

  await recordAudit({
    adminId,
    action: "analytics.exclusion-updated",
    entity: "site_settings",
    entityId: "global",
    summary: `Analytics exclusions: ${next.length} entries`,
    metadata: { ...context, hashes: next.map((entry) => entry.hash.slice(0, 8)) },
  });

  bumpTags(CONFIG_TAGS.site);
  return next;
}

/**
 * Excludes the browser that is making the request. The hashes are derived on the
 * server from the same inputs the beacon uses, so the admin never handles them.
 */
export async function excludeCurrentVisitorAction(formData: FormData) {
  return runAction("analytics.exclude", async () => {
    const context = await requireActionContext(
      PERMISSIONS.analyticsView,
      String(formData.get(CSRF_FIELD) ?? ""),
    );

    const label = excludedVisitorSchema.shape.label.parse(String(formData.get("label") ?? ""));
    const browserId = String(formData.get("browserId") ?? "").trim();

    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = headerList.get("user-agent") ?? "";
    const day = new Date().toISOString().slice(0, 10);

    const entries: ExcludedVisitor[] = [
      {
        hash: hash(`${day}|${ip}|${userAgent}`),
        label,
        createdAt: new Date().toISOString(),
        kind: "daily",
      },
    ];

    if (browserId) {
      entries.push({
        hash: hash(`browser|${browserId}`),
        label,
        createdAt: new Date().toISOString(),
        kind: "browser",
      });
    }

    const { list } = await readCurrent();
    const known = new Set(list.map((entry) => entry.hash));
    const next = [...list, ...entries.filter((entry) => !known.has(entry.hash))];

    if (next.length > 50) {
      throw new AppError("The exclusion list is full. Remove an entry first.", "CONFLICT", 409);
    }

    return { count: (await writeList(next, context.session.id, { ip: context.ip })).length };
  });
}

export async function removeVisitorExclusionAction(formData: FormData) {
  return runAction("analytics.exclusion-remove", async () => {
    const context = await requireActionContext(
      PERMISSIONS.analyticsView,
      String(formData.get(CSRF_FIELD) ?? ""),
    );
    const target = excludedVisitorSchema.shape.hash.parse(String(formData.get("hash") ?? ""));

    const { list } = await readCurrent();
    const next = list.filter((entry) => entry.hash !== target);
    if (next.length === list.length) {
      throw new AppError("That exclusion no longer exists.", "NOT_FOUND", 404);
    }

    return { count: (await writeList(next, context.session.id, { ip: context.ip })).length };
  });
}
