import { PageHeader, StatCard } from "@/components/admin/page";
import { listMedia, mediaUsage } from "@/lib/services/media";
import { MediaLibrary } from "./media-library";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaPage() {
  const [assets, usage] = await Promise.all([listMedia(), mediaUsage()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CONTENT"
        title="Media library"
        description="Assets used by the portrait, project covers and case study galleries. Uploads are validated on the server and stored through the configured driver."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Assets" value={String(usage.count)} />
        <StatCard label="Storage used" value={formatBytes(usage.bytes)} />
        <StatCard label="Missing alt text" value={String(assets.filter((asset) => !asset.alt).length)} />
      </div>

      <MediaLibrary initial={assets} />
    </div>
  );
}
