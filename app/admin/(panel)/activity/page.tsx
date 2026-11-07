import { desc, eq } from "drizzle-orm";
import { PageHeader, Panel, EmptyState } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/lib/db/client";
import { auditLogs, admins } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";
import { hasDatabase } from "@/lib/rsc-guard";

export const dynamic = "force-dynamic";

async function loadActivity() {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    return await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        summary: auditLogs.summary,
        createdAt: auditLogs.createdAt,
        adminName: admins.name,
      })
      .from(auditLogs)
      .leftJoin(admins, eq(admins.id, auditLogs.adminId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);
  } catch {
    return [];
  }
}

export default async function ActivityPage() {
  const entries = await loadActivity();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="OVERVIEW"
        title="Activity log"
        description="Append-only record of admin actions. Entries are written server-side."
      />

      <Panel title="Latest 100 events" bodyClassName="p-0">
        {entries.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No activity yet" description="Admin actions are logged here." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {["When", "Action", "Entity", "Summary"].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-line/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-fg-dim">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone="muted">{entry.action}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-fg-muted">{entry.entity}</td>
                    <td className="px-4 py-2.5 text-[12px] text-fg-muted">
                      {entry.summary ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
