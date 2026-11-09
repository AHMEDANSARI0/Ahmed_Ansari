import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Code2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HairlineRule } from "@/components/ui/technical-frame";
import { ShotGallery } from "@/components/work/shot-gallery";
import { getProjectBySlug, getAllProjectSlugs } from "@/lib/services/projects";
import { getSiteSettings } from "@/lib/services/settings";
import { buildMetadata, projectJsonLd } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSiteSettings()]);

  if (!project) {
    return { title: "Project not found", robots: { index: false, follow: false } };
  }

  return buildMetadata({
    title: project.seoTitle ?? `${project.title} — case study`,
    description: project.seoDescription ?? project.shortDescription,
    path: `/work/${project.slug}`,
    site: settings,
    image: project.coverImageUrl,
    type: "article",
  });
}

const stages = ["live", "in-development", "concept", "archived"] as const;

function stageLabel(value: string) {
  return value.replace("-", " ");
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSiteSettings()]);

  if (!project) notFound();

  const sections = [
    { key: "problem", label: "01 / Problem", body: project.problem },
    { key: "architecture", label: "02 / Architecture", body: project.architecture },
    { key: "solution", label: "03 / Implementation", body: project.solution },
    { key: "outcome", label: "04 / Outcome", body: project.outcome },
  ].filter((entry) => Boolean(entry.body));

  return (
    <article className="px-4 pb-24 pt-12 sm:px-6 lg:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            projectJsonLd({
              title: project.title,
              description: project.shortDescription,
              slug: project.slug,
              domain: settings.domain,
              technologies: project.technologies,
            }),
          ),
        }}
      />

      <div className="mx-auto w-full max-w-[1100px]">
        <Link
          href="/work"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3 w-3" />
          All case studies
        </Link>

        <header className="mt-8 border-b border-line pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={project.stage === "live" ? "success" : "accent"}>
              {stageLabel(project.stage)}
            </Badge>
            {project.publishedAt ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
                {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(
                  project.publishedAt,
                )}
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.6rem)] font-bold uppercase leading-[0.95] tracking-tight">
            {project.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
            {project.shortDescription}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {project.demoUrl ? (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 angular-clip bg-accent px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink"
              >
                <Play className="h-3 w-3" /> Live demo
              </a>
            ) : null}
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 border border-line px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:border-accent/60 hover:text-accent"
              >
                <Code2 className="h-3 w-3" /> Repository
              </a>
            ) : null}
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="border border-line/70 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim"
              >
                {tech}
              </span>
            ))}
          </div>
        </header>

        {project.coverImageUrl ? (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden border border-line bg-ink-soft">
            <Image
              src={project.coverImageUrl}
              alt={`${project.title} cover`}
              fill
              sizes="(max-width: 1100px) 100vw, 1100px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        <section className="mt-10">
          <p className="max-w-3xl text-[15px] leading-relaxed text-fg-muted">
            {project.fullDescription}
          </p>
        </section>

        <div className="mt-12 space-y-10">
          {sections.map((entry) => (
            <section key={entry.key}>
              <HairlineRule />
              <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
                <h2 className="mono-label text-accent">{entry.label}</h2>
                <p className="max-w-3xl whitespace-pre-line text-[14px] leading-relaxed text-fg-muted">
                  {entry.body}
                </p>
              </div>
            </section>
          ))}
        </div>

        {project.features.length > 0 ? (
          <section className="mt-12">
            <HairlineRule />
            <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
              <h2 className="mono-label text-accent">Capabilities</h2>
              <ul className="grid gap-px bg-line sm:grid-cols-2">
                {project.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 bg-ink px-4 py-3">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rotate-45 bg-accent" />
                    <span className="text-[13px] leading-relaxed text-fg-muted">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {project.architectureImageUrl ? (
          <section className="mt-12">
            <HairlineRule />
            <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
              <h2 className="mono-label text-accent">Diagram</h2>
              <div className="relative aspect-[16/9] w-full overflow-hidden border border-line bg-ink-soft">
                <Image
                  src={project.architectureImageUrl}
                  alt={`${project.title} architecture diagram`}
                  fill
                  sizes="(max-width: 1100px) 100vw, 880px"
                  className="object-contain"
                />
              </div>
            </div>
          </section>
        ) : null}

        {project.gallery.length > 0 ? (
          <section className="mt-12">
            <HairlineRule />
            <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
              <h2 className="mono-label text-accent">Gallery</h2>
              <ShotGallery shots={project.gallery} />
            </div>
          </section>
        ) : null}

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
            Status: {stages.includes(project.stage as (typeof stages)[number]) ? stageLabel(project.stage) : project.stage}
          </p>
          <Link
            href="/#contact"
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:text-accent"
          >
            Discuss a similar system
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </footer>
      </div>
    </article>
  );
}
