import type { Metadata } from "next";
import { WorkGallery } from "@/components/work/work-gallery";
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

        <WorkGallery
          projects={projects.map((project) => ({
            id: project.id,
            slug: project.slug,
            title: project.title,
            shortDescription: project.shortDescription,
            coverImageUrl: project.coverImageUrl,
            stage: project.stage,
            technologies: project.technologies,
          }))}
        />
      </div>
    </div>
  );
}
