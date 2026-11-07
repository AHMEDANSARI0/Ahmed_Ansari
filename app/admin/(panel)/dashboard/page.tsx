import Link from "next/link";
import { ArrowUpRight, Database, Sparkles } from "lucide-react";
import { PageHeader, Panel, StatCard, EmptyState } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import {
  getDashboardStats,
  getRecentActivity,
  getRecentInquiries,
} from "@/lib/services/admin-stats";
import { formatDateTime } from "@/lib/utils";
import { hasDatabase } from "@/lib/rsc-guard";
import { isAiConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

const statusTone = {
  new: "accent",
  contacted: "warning",
  qualified: "success",
  converted: "success",
  archived: "muted",
} as const;

export default async function DashboardPage() {
  const [stats, inquiries, activity] = await Promise.all([
    getDashboardStats(),
    getRecentInquiries(),
    getRecentActivity(),
  ]);

  const configured = hasDatabase();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CONTROL PLANE"
        title="Dashboard"
        description="Live counts from the database. Nothing here is estimated or sampled."
        actions={
          <Badge tone={configured ? "success" : "danger"}>
            {configured ? "Database connected" : "Database missing"}
          </Badge>
        }
      />

      {!configured ? (
        <Panel title="Setup required">
          <p className="text-[13px] text-fg-muted">
            Set <code className="font-mono text-accent">DATABASE_URL</code> in .env.local, then run{" "}
            <code className="font-mono text-accent">npm run setup</code> and{" "}
            <code className="font-mono text-accent">npm run admin:create</code>.
          </p>
        </Panel>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Projects" value={stats?.totalProjects ?? 0} hint="All records" />
        <StatCard
          label="Published"
          value={stats?.publishedProjects ?? 0}
          hint={`${stats?.draftProjects ?? 0} draft`}
          tone="accent"
        />
        <StatCard
          label="Inquiries"
          value={stats?.totalInquiries ?? 0}
          hint={`${stats?.unreadInquiries ?? 0} unread`}
        />
        <StatCard
          label="Open leads"
          value={stats?.newInquiries ?? 0}
          hint="Status: new"
          tone={stats && stats.newInquiries > 0 ? "accent" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Recent inquiries"
          className="lg:col-span-2"
          actions={
            <Link
              href="/admin/inquiries"
              className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim hover:text-accent"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
          bodyClassName="p-0"
        >
          {inquiries.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No inquiries yet"
                description="Submissions from the public contact form will appear here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {inquiries.map((inquiry) => (
                <li key={inquiry.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] text-fg">{inquiry.name}</p>
                      {!inquiry.isRead ? <span className="h-1.5 w-1.5 bg-accent" /> : null}
                    </div>
                    <p className="truncate font-mono text-[11px] text-fg-dim">
                      {inquiry.email}
                      {inquiry.projectType ? ` · ${inquiry.projectType}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={statusTone[inquiry.status] ?? "neutral"}>{inquiry.status}</Badge>
                    <span className="hidden font-mono text-[10px] text-fg-dim sm:block">
                      {formatDateTime(inquiry.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Content overview">
            <dl className="space-y-2.5">
              {[
                ["Services", stats?.serviceCount ?? 0],
                ["Technologies", stats?.technologyCount ?? 0],
                ["Media assets", stats?.mediaCount ?? 0],
                ["Featured projects", stats?.featuredProjects ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between">
                  <dt className="text-[12px] text-fg-muted">{label}</dt>
                  <dd className="font-mono text-[12px] tabular-nums text-fg">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="System status">
            <ul className="space-y-2.5">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] text-fg-muted">
                  <Database className="h-3 w-3 text-fg-dim" /> Database
                </span>
                <Badge tone={configured ? "success" : "danger"}>
                  {configured ? "online" : "offline"}
                </Badge>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] text-fg-muted">
                  <Sparkles className="h-3 w-3 text-fg-dim" /> AI assistant
                </span>
                <Badge tone={isAiConfigured ? "success" : "muted"}>
                  {isAiConfigured ? "configured" : "not configured"}
                </Badge>
              </li>
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Recent activity" bodyClassName="p-0">
        {activity.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No activity recorded"
              description="Audit entries appear as soon as a signed-in admin performs an action."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                    {entry.entity}
                  </span>
                  <p className="truncate text-[12px] text-fg-muted">
                    {entry.summary ?? entry.action}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-fg-dim">
                  {formatDateTime(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
