"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverImageUrl: string | null;
  stage: string;
  technologies: string[];
};

function Facet({
  label,
  value,
  active,
  count,
  onToggle,
}: {
  label: string;
  value: string;
  active: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={`${label}: ${value}, ${count} ${count === 1 ? "project" : "projects"}`}
      className={cn(
        "inline-flex h-7 items-center gap-2 border px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
        active
          ? "border-accent/70 bg-accent/10 text-accent"
          : "border-line text-fg-muted hover:border-accent/40 hover:text-fg",
      )}
    >
      {value}
      <span className={cn("tabular-nums", active ? "text-accent/70" : "text-fg-dim")}>{count}</span>
    </button>
  );
}

/**
 * A missing cover renders a thin technical band with the slug. It is deliberately
 * small: no stock photo, and no large empty box pretending to be a screenshot.
 */
function CoverBand({ item }: { item: WorkItem }) {
  if (item.coverImageUrl) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden border border-line bg-ink-soft">
        <Image
          src={item.coverImageUrl}
          alt={`${item.title} interface`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
    );
  }

  return (
    <div className="flex h-9 items-center justify-between border border-line bg-ink-soft px-2.5">
      <span className="mono-label text-fg-dim">no capture yet</span>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim/70">
        /{item.slug}
      </span>
    </div>
  );
}

export function WorkGallery({ projects }: { projects: WorkItem[] }) {
  const [stages, setStages] = useState<string[]>([]);
  const [techs, setTechs] = useState<string[]>([]);

  const stageFacets = useMemo(() => {
    const map = new Map<string, number>();
    for (const project of projects) {
      map.set(project.stage, (map.get(project.stage) ?? 0) + 1);
    }
    // Only stages that actually exist: no empty facets, no invented tags.
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [projects]);

  const techFacets = useMemo(() => {
    const map = new Map<string, number>();
    for (const project of projects) {
      for (const tech of project.technologies) {
        map.set(tech, (map.get(tech) ?? 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const stageOk = stages.length === 0 || stages.includes(project.stage);
      const techOk =
        techs.length === 0 || techs.every((tech) => project.technologies.includes(tech));
      return stageOk && techOk;
    });
  }, [projects, stages, techs]);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

  const clear = () => {
    setStages([]);
    setTechs([]);
  };

  const active = stages.length + techs.length > 0;

  return (
    <div className="mt-6">
      <div className="space-y-4 border-b border-line pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim" aria-live="polite">
            {filtered.length} of {projects.length} {projects.length === 1 ? "record" : "records"}
          </p>
          {active ? (
            <button
              type="button"
              onClick={clear}
              className="inline-flex h-7 items-center gap-1.5 border border-line px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted transition-colors hover:border-accent/50 hover:text-accent"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          ) : null}
        </div>

        {stageFacets.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 font-mono text-[9.5px] uppercase tracking-[0.18em] text-fg-dim">
              Stage
            </span>
            {stageFacets.map(([value, count]) => (
              <Facet
                key={value}
                label="Filter by stage"
                value={value}
                count={count}
                active={stages.includes(value)}
                onToggle={() => setStages((current) => toggle(current, value))}
              />
            ))}
          </div>
        ) : null}

        {techFacets.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 font-mono text-[9.5px] uppercase tracking-[0.18em] text-fg-dim">
              Stack
            </span>
            {techFacets.map(([value, count]) => (
              <Facet
                key={value}
                label="Filter by technology"
                value={value}
                count={count}
                active={techs.includes(value)}
                onToggle={() => setTechs((current) => toggle(current, value))}
              />
            ))}
          </div>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <p className="mt-10 border border-dashed border-line px-6 py-16 text-center text-sm text-fg-muted">
          No published projects yet.
        </p>
      ) : filtered.length === 0 ? (
        <div className="mt-10 border border-dashed border-line px-6 py-16 text-center">
          <p className="text-sm text-fg-muted">Nothing matches that combination.</p>
          <button
            type="button"
            onClick={clear}
            className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-accent hover:underline"
          >
            Clear the filters
          </button>
        </div>
      ) : (
        <ul className={cn("grid gap-px bg-line", filtered.length > 1 && "md:grid-cols-2")}>
          {filtered.map((project) => {
            const index = projects.indexOf(project) + 1;
            return (
              <li key={project.id} className="bg-ink">
                <Link
                  href={`/work/${project.slug}`}
                  className="group flex h-full flex-col gap-4 p-4 transition-colors duration-300 hover:bg-card/40 sm:p-6"
                >
                  <CoverBand item={project} />

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] tabular-nums text-fg-dim">
                          {String(index).padStart(2, "0")}
                        </span>
                        <h2 className="font-display text-[clamp(1.1rem,2vw,1.5rem)] font-semibold uppercase leading-tight tracking-wide text-fg transition-colors group-hover:text-accent">
                          {project.title}
                        </h2>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]",
                          project.stage === "live"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : project.stage === "in-development"
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-line text-fg-dim",
                        )}
                      >
                        {project.stage}
                      </span>
                    </div>

                    <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-fg-muted">
                      {project.shortDescription}
                    </p>

                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
                      {project.technologies.map((tech) => (
                        <li
                          key={tech}
                          className="border border-line/70 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>

                    <span className="mt-auto flex items-center justify-between border-t border-line/70 pt-3 text-[11px] text-fg-dim">
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em]">
                        Case study
                      </span>
                      <ArrowUpRight className="h-4 w-4 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {techs.length > 1 ? (
        <p className="mt-4 text-[11px] text-fg-dim">
          Stack filters combine: a project must use every selected technology.
        </p>
      ) : null}
    </div>
  );
}
