import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getProjectCards } from "@/lib/services/content";
import { getSiteSettings } from "@/lib/services/settings";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({
    title: "Work — case studies",
    description:
      "Engineering case studies: problem, architecture, implementation and outcome for each system.",
    path: "/work",
    site: settings,
  });
}

export default async function WorkIndexPage() {
  const projects = await getProjectCards();

  return (
    <div className="px-4 pb-24 pt-16 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="border-b border-line pb-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-accent/70" />
            <span className="mono-label text-accent">Archive</span>
          </div>
          <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.4rem)] font-bold uppercase leading-none tracking-tight">
            Case studies
          </h1>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-fg-muted">
            Each record documents the problem, the architecture and what was actually implemented.
            Nothing is described as live until it is.
          </p>
        </header>

        {/* Cover images are charted from the model, so a missing asset degrades to the numbered list. */}
        <ul className="mt-2 divide-y divide-line">
          {projects.map((project, index) => (
            <li key={project.id}>
              <Link
                href={`/work/${project.slug}`}
                className="group grid gap-4 py-7 transition-colors sm:grid-cols-[64px_1fr_auto] sm:items-center"
              >
                <span className="font-mono text-[11px] tabular-nums text-fg-dim">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fg transition-colors group-hover:text-accent">
                      {project.title}
                    </h2>
                    <Badge tone="muted">{project.stage}</Badge>
                  </div>
                  <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
                    {project.shortDescription}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {project.technologies.map((tech) => (
                      <li
                        key={tech}
                        className="border border-line/70 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
                <ArrowUpRight className="hidden h-4 w-4 text-fg-dim transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent sm:block" />
              </Link>
            </li>
          ))}
        </ul>

        {projects.length === 0 ? (
          <p className="mt-10 border border-dashed border-line px-6 py-16 text-center text-sm text-fg-muted">
            No published projects yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
