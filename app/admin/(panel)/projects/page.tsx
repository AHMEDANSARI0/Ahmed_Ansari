import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel } from "@/components/admin/page";
import { listAdminProjects } from "@/lib/services/projects-admin";

export const dynamic = "force-dynamic";

const tone = (status: string) =>
  status === "published" ? "success" : status === "draft" ? "muted" : "warning";

export default async function ProjectsPage() {
  const projects = await listAdminProjects();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CONTENT"
        title="Projects"
        description="Case studies shown on /work. Drafts stay invisible to visitors until published."
        actions={
          <Link
            href="/admin/projects/new"
            className="inline-flex h-9 items-center gap-2 bg-accent px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink"
          >
            <Plus className="h-3 w-3" /> New project
          </Link>
        }
      />

      <Panel title={`${projects.length} projects`}>
        {projects.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-fg-muted">
            No projects yet. Create the first case study.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {projects.map((project) => (
              <li key={project.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="truncate font-display text-[13px] uppercase tracking-[0.06em] text-fg hover:text-accent"
                    >
                      {project.title}
                    </Link>
                    <Badge tone={tone(project.status)}>{project.status}</Badge>
                    <Badge tone="muted">{project.stage.replace("-", " ")}</Badge>
                    {project.isFeatured ? <Badge tone="accent">featured</Badge> : null}
                  </div>
                  <p className="mt-1 truncate text-[11.5px] text-fg-muted">{project.shortDescription}</p>
                  <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim">
                    /work/{project.slug}
                    {project.technologyNames.length > 0 ? ` · ${project.technologyNames.join(" / ")}` : ""}
                  </p>
                </div>
                {project.status === "published" ? (
                  <a
                    href={`/work/${project.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 border border-line px-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-muted hover:text-accent"
                  >
                    View <ArrowUpRight className="h-3 w-3" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
