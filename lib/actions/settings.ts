"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { siteSettings, socialLinks } from "@/lib/db/schema";
import { runAction } from "@/lib/actions/result";
import { requireActionContext } from "@/lib/security/guard";
import { PERMISSIONS } from "@/lib/permissions";
import { siteSettingsSchema } from "@/lib/validations/settings";
import { recordAudit } from "@/lib/audit";
import { bumpTags } from "@/lib/cache";
import { CONFIG_TAGS } from "@/lib/services/settings";

export async function updateSiteSettingsAction(formData: FormData) {
  return runAction("settings.update", async () => {
    const context = await requireActionContext(
      PERMISSIONS.settingsManage,
      String(formData.get("csrf-token") ?? ""),
    );
    const raw = formData.get("payload");
    if (typeof raw !== "string") throw new Error("Missing payload");

    const parsed = siteSettingsSchema.parse(JSON.parse(raw));
    const db = getDb();

    await db
      .insert(siteSettings)
      .values({ key: "global", value: parsed, updatedBy: context.session.id })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: parsed, updatedBy: context.session.id, updatedAt: new Date() },
      });

    await db.delete(socialLinks);
    if (parsed.socialLinks.length > 0) {
      await db.insert(socialLinks).values(
        parsed.socialLinks.map((link, index) => ({
          platform: link.platform,
          label: link.label,
          url: link.url,
          position: index,
          isVisible: link.visible,
        })),
      );
    }

    await recordAudit({
      adminId: context.session.id,
      action: "settings.updated",
      entity: "site_settings",
      entityId: "global",
      summary: "Global site settings saved",
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.site);
    return { savedAt: new Date().toISOString() };
  });
}

export async function toggleMaintenanceAction(enabled: boolean) {
  return runAction("settings.maintenance", async () => {
    const context = await requireActionContext(PERMISSIONS.settingsManage);
    const db = getDb();

    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "global"))
      .limit(1);

    const current = (row?.value ?? {}) as Record<string, unknown>;
    const next = { ...current, maintenanceMode: enabled };

    await db
      .insert(siteSettings)
      .values({ key: "global", value: next, updatedBy: context.session.id })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: next, updatedBy: context.session.id, updatedAt: new Date() },
      });

    await recordAudit({
      adminId: context.session.id,
      action: enabled ? "settings.maintenance-on" : "settings.maintenance-off",
      entity: "site_settings",
      entityId: "global",
      summary: `Maintenance mode ${enabled ? "enabled" : "disabled"}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.site);
    return { maintenanceMode: enabled };
  });
}
