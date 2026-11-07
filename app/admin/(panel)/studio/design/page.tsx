import { PageHeader } from "@/components/admin/page";
import { getDesignSettings } from "@/lib/services/settings";
import { DesignStudio } from "./design-studio";

export const dynamic = "force-dynamic";

export default async function DesignStudioPage() {
  const design = await getDesignSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STUDIO"
        title="Design studio"
        description="Colour system, geometric pattern, typography and layout. Every change is validated server side and revalidated on save."
      />
      <DesignStudio initial={design} />
    </div>
  );
}
