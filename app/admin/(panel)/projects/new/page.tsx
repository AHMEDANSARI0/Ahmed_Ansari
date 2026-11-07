import { PageHeader } from "@/components/admin/page";
import { ProjectForm, emptyProject } from "@/components/admin/project-form";
import { listTechnologies } from "@/lib/services/projects-admin";
import { listMedia } from "@/lib/services/media";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const [technologies, media] = await Promise.all([listTechnologies(), listMedia({ limit: 60 })]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="CONTENT" title="New project" description="Everything here is editable later." />
      <ProjectForm
        mode="create"
        initial={emptyProject}
        technologies={technologies}
        mediaUrls={media.map((asset) => asset.url)}
      />
    </div>
  );
}
