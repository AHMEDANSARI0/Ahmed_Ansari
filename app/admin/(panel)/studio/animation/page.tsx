import { PageHeader } from "@/components/admin/page";
import { getAnimationSettings } from "@/lib/services/settings";
import { AnimationStudio } from "./animation-studio";

export const dynamic = "force-dynamic";

export default async function AnimationStudioPage() {
  const animation = await getAnimationSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STUDIO"
        title="Animation studio"
        description="Duration, easing, intensity and per-section reveal behaviour. The preview replays the real timeline."
      />
      <AnimationStudio initial={animation} />
    </div>
  );
}
