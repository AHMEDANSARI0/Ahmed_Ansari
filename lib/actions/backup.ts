"use server";

import { getDb } from "@/lib/db/client";
import { backupRecords } from "@/lib/db/schema";
import { runAction } from "@/lib/actions/result";
import { requireActionContext } from "@/lib/security/guard";
import { PERMISSIONS } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { buildContentBackup } from "@/lib/services/backup";

const CSRF_FIELD = "csrf-token";

export async function createBackupAction(formData: FormData) {
  return runAction("backup.create", async () => {
    const context = await requireActionContext(
      PERMISSIONS.backupManage,
      String(formData.get(CSRF_FIELD) ?? ""),
    );

    const backup = await buildContentBackup();
    const payload = JSON.stringify(backup, null, 2);
    const sizeBytes = Buffer.byteLength(payload);
    const fileName = `content-${backup.exportedAt.slice(0, 19).replace(/[:T]/g, "-")}.json`;

    const db = getDb();
    const [created] = await db
      .insert(backupRecords)
      .values({
        kind: "content",
        fileName,
        sizeBytes,
        tableCounts: backup.counts,
        notes: "Content snapshot generated from the admin panel",
        createdBy: context.session.id,
      })
      .returning({ id: backupRecords.id, createdAt: backupRecords.createdAt });

    await recordAudit({
      adminId: context.session.id,
      action: "backup.created",
      entity: "backup_records",
      entityId: created?.id,
      summary: `${fileName} (${Math.round(sizeBytes / 1024)} KB)`,
      ip: context.ip,
    });

    return { id: created?.id ?? "", fileName, payload };
  });
}
