import { desc } from "drizzle-orm";
import { Download, Database } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/admin/page";
import { getDb } from "@/lib/db/client";
import { backupRecords } from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";
import { tableSize } from "@/lib/services/backup";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function BackupsPage() {
  const [records, size] = await Promise.all([
    hasDatabase()
      ? getDb().select().from(backupRecords).orderBy(desc(backupRecords.createdAt)).limit(25)
      : Promise.resolve([]),
    tableSize(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SYSTEM"
        title="Backups"
        description="Content snapshots: sections, settings, projects, services, skills and technologies as JSON. Media files live in the storage driver and are not duplicated here."
        actions={
          <a
            href="/api/admin/backup"
            className="inline-flex h-9 items-center gap-2 bg-accent px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink"
          >
            <Download className="h-3 w-3" /> Export now
          </a>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Database size" value={formatBytes(size)} />
        <StatCard label="Snapshots" value={String(records.length)} />
        <StatCard
          label="Latest"
          value={records[0] ? formatDateTime(records[0].createdAt) : "Never"}
          hint={records[0] ? formatBytes(records[0].sizeBytes ?? 0) : undefined}
        />
      </div>

      <Panel title="Snapshot log">
        {records.length === 0 ? (
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-fg-muted">
            <Database className="h-4 w-4 text-fg-dim" />
            No snapshots yet. Export one before large content changes.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {records.map((record) => (
              <li key={record.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11.5px] text-fg">{record.fileName}</p>
                  <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-fg-dim">
                    {record.kind} · {formatDateTime(record.createdAt)} ·{" "}
                    {formatBytes(record.sizeBytes ?? 0)}
                  </p>
                </div>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-fg-dim">
                  {Object.entries((record.tableCounts ?? {}) as Record<string, number>)
                    .map(([key, value]) => `${key}:${value}`)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
