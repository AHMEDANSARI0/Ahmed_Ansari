import { PageHeader } from "@/components/admin/page";
import { getStudioSections } from "@/lib/services/studio";
import { SectionsManager } from "./sections-manager";
import { defaultHeroContent } from "@/lib/config/sections";

export const dynamic = "force-dynamic";

const editableFields: Record<string, string[]> = {
  hero: Object.keys(defaultHeroContent).filter((key) => key !== "heading" && key !== "description"),
  about: ["philosophy", "highlights"],
  contact: ["responseTime", "projectTypes", "budgetRanges", "timelines"],
};

export default async function SectionManagerPage() {
  const sections = await getStudioSections();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STUDIO"
        title="Section manager"
        description="Reorder the page, rename navigation entries, change anchors and edit the structured content behind each section."
      />
      <SectionsManager initial={sections} editableFields={editableFields} />
    </div>
  );
}
