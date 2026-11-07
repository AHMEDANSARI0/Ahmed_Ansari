import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page";
import { ProjectForm, type ProjectDraft } from "@/components/admin/project-form";
import { getAdminProject, listTechnologies } from "@/lib/services/projects-admin";
import { listMedia } from "@/lib/services/media";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, technologies, media] = await Promise.all([
    getAdminProject(id),
    listTechnologies(),
    listMedia({ limit: 60 }),
  ]);

  if (!project) notFound();

  const draft: ProjectDraft = {
    title: project.title,
    slug: project.slug,
    shortDescription: project.shortDescription,
    fullDescription: project.fullDescription,
    problem: project.problem ?? "",
    architecture: project.architecture ?? "",
    solution: project.solution ?? "",
    outcome: project.outcome ?? "",
    features: project.features,
    stage: project.stage,
    status: project.status,
    isFeatured: project.isFeatured,
    coverImageUrl: project.coverImageUrl ?? "",
    architectureImageUrl: project.architectureImageUrl ?? "",
    demoUrl: project.demoUrl ?? "",
    repoUrl: project.repoUrl ?? "",
    seoTitle: project.seoTitle ?? "",
    seoDescription: project.seoDescription ?? "",
    technologyIds: project.technologyIds,
    gallery: project.gallery,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CONTENT"
        title={project.title}
        description={`Last updated ${project.updatedAt.toISOString().slice(0, 10)} · ${project.status}`}
      />
      <ProjectForm
        mode="edit"
        projectId={project.id}
        initial={draft}
        technologies={technologies}
        mediaUrls={media.map((asset) => asset.url)}
      />
    </div>
  );
}
