import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionShell } from "@/components/sections/section-shell";
import { Badge } from "@/components/ui/badge";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";
import type { ProjectCard, SectionRecord } from "@/lib/services/content";

const stageTone: Record<string, "accent" | "success" | "muted" | "warning"> = {
  live: "success",
  "in-development": "accent",
  concept: "muted",
  archived: "muted",
};

export function Projects({
  section,
  projects,
  animation,
  sectionType,
}: {
  section?: SectionRecord;
  projects: ProjectCard[];
  animation: AnimationConfig;
  sectionType?: AnimationType;
}) {
  const list = [...projects].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.position - b.position,
  );

  return (
    <SectionShell
      id="work"
      eyebrow={section?.eyebrow ?? "SELECTED WORK"}
      heading={section?.heading ?? "Selected systems"}
      description={section?.description}
      animation={animation}
      animationType={sectionType}
      aside={
        <Link
          href="/work"
          className="group inline-flex h-10 items-center gap-2 border border-line px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted transition-colors hover:border-accent/60 hover:text-accent"
        >
          All projects
          <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      }
    >
      {list.length === 0 ? (
        <div className="border border-dashed border-line px-6 py-16 text-center">
          <p className="text-sm text-fg-muted">No published projects yet.</p>
        </div>
      ) : (
        <div className="grid gap-px bg-line md:grid-cols-2">
          {list.map((project, index) => (
            <Link
              key={project.id}
              href={`/work/${project.slug}`}
              className="reveal reveal-clip-path group relative flex flex-col justify-between bg-ink p-5 transition-colors duration-300 hover:bg-card/50 sm:p-7"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tabular-nums text-fg-dim">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Badge tone={stageTone[project.stage] ?? "muted"}>{project.stage}</Badge>
                </div>

                <h3 className="mt-6 font-display text-[clamp(1.3rem,2.4vw,1.9rem)] font-bold uppercase leading-tight tracking-tight text-fg transition-colors group-hover:text-accent">
                  {project.title}
                </h3>
                <p className="mt-3 max-w-md text-[13px] leading-relaxed text-fg-muted">
                  {project.shortDescription}
                </p>

                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 5).map((tech) => (
                    <li
                      key={tech}
                      className="border border-line/70 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-line/70 pt-4">
                <span className="mono-label text-fg-dim">Case study</span>
                <ArrowUpRight className="h-4 w-4 text-fg-dim transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>

              {project.coverImageUrl ? (
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <Image
                    src={project.coverImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-15"
                  />
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
