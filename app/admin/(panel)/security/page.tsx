import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { PageHeader, Panel, EmptyState } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { adminSessions, admins } from "@/lib/db/schema";
import { formatDateTime, truncate } from "@/lib/utils";
import { hasDatabase } from "@/lib/rsc-guard";
import { RevokeSessionButton } from "./revoke-session-button";

export const dynamic = "force-dynamic";

async function loadSessions() {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    return await db
      .select({
        id: adminSessions.id,
        adminName: admins.name,
        userAgent: adminSessions.userAgent,
        createdAt: adminSessions.createdAt,
        expiresAt: adminSessions.expiresAt,
        lastSeenAt: adminSessions.lastSeenAt,
      })
      .from(adminSessions)
      .innerJoin(admins, eq(admins.id, adminSessions.adminId))
      .where(and(isNull(adminSessions.revokedAt), gt(adminSessions.expiresAt, new Date())))
      .orderBy(desc(adminSessions.createdAt))
      .limit(50);
  } catch {
    return [];
  }
}

export default async function SecurityPage() {
  const session = await requireSession();
  const sessions = await loadSessions();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SYSTEM"
        title="Security"
        description="Active sessions across devices. Revoking a session takes effect on the next request."
      />

      <Panel title="Active sessions" bodyClassName="p-0">
        {sessions.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No active sessions" />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] text-fg">{entry.adminName}</p>
                    {entry.id === session.sessionId ? <Badge tone="accent">this device</Badge> : null}
                  </div>
                  <p className="truncate font-mono text-[11px] text-fg-dim">
                    {truncate(entry.userAgent ?? "unknown client", 80)}
                  </p>
                  <p className="font-mono text-[10px] text-fg-dim">
                    started {formatDateTime(entry.createdAt)} · expires {formatDateTime(entry.expiresAt)}
                  </p>
                </div>
                {entry.id === session.sessionId ? null : (
                  <RevokeSessionButton sessionId={entry.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Authentication policy">
        <ul className="space-y-2 text-[12.5px] text-fg-muted">
          <li>Argon2id password hashing (19 MiB, 2 iterations).</li>
          <li>HttpOnly, SameSite=Lax session cookies with 12 hour expiry.</li>
          <li>Six failed attempts within 15 minutes blocks the identifier.</li>
          <li>CSRF token required on every mutating server action.</li>
          <li>No public registration endpoint exists.</li>
        </ul>
      </Panel>
    </div>
  );
}
