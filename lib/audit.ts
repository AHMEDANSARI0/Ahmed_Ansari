import { getDb } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";
import { hashIdentifier } from "@/lib/auth/session";
import { logError } from "@/lib/errors";

type AuditInput = {
  adminId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  summary?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

export async function recordAudit({
  adminId,
  action,
  entity,
  entityId,
  summary,
  metadata,
  ip,
}: AuditInput) {
  if (!process.env.DATABASE_URL) return;
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      adminId: adminId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      summary: summary?.slice(0, 300),
      metadata: metadata ?? null,
      ipHash: ip ? hashIdentifier(ip) : null,
    });
  } catch (error) {
    logError("audit", error);
  }
}
