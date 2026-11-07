"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { adminSessions } from "@/lib/db/schema";
import { runAction } from "@/lib/actions/result";
import { requireActionContext } from "@/lib/security/guard";
import { PERMISSIONS } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";

export async function revokeSessionAction(sessionId: string) {
  return runAction("security.revoke-session", async () => {
    const context = await requireActionContext(PERMISSIONS.usersManage);
    if (sessionId === context.session.sessionId) {
      throw new AppError("Use sign out to end the current session.", "CONFLICT", 409);
    }

    const db = getDb();
    const [updated] = await db
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(eq(adminSessions.id, sessionId))
      .returning({ id: adminSessions.id });

    if (!updated) throw new AppError("Session not found.", "NOT_FOUND", 404);

    await recordAudit({
      adminId: context.session.id,
      action: "security.session-revoked",
      entity: "admin_sessions",
      entityId: sessionId,
      summary: "Session revoked by admin",
      ip: context.ip,
    });

    return { revoked: sessionId };
  });
}
