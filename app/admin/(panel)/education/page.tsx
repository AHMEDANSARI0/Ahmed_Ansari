import { PageHeader } from "@/components/admin/page";
import { EducationManager } from "@/components/admin/education-manager";
import { listEducation } from "@/lib/services/education-admin";

export const dynamic = "force-dynamic";

export default async function EducationPage() {
  const entries = await listEducation();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CONTENT"
        title="Education"
        description="Institution, programme and years, rendered as a compact timeline inside the About section. Nothing is seeded: an empty list means no block on the public site."
      />
      <EducationManager entries={entries} />
    </div>
  );
}
