import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { PageHeader } from "@/components/admin/page";
import { getPortraitSettings } from "@/lib/services/settings";
import { PortraitStudio } from "./portrait-studio";

export const dynamic = "force-dynamic";

const PLACEHOLDER = "/images/portrait-placeholder.jpg";

async function listPortraitImages() {
  try {
    const files = await readdir(join(process.cwd(), "public", "uploads"));
    return files.filter((file) => /\.(jpe?g|png|webp|avif)$/i.test(file)).map((file) => `/uploads/${file}`);
  } catch {
    return [];
  }
}

export default async function PortraitStudioPage() {
  const [portrait, images] = await Promise.all([getPortraitSettings(), listPortraitImages()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STUDIO"
        title="Portrait & particles"
        description="Tune the reconstruction: density, colour, assembly timing and cursor response for each device."
      />
      <PortraitStudio initial={portrait} portraitUrl={portrait.imageUrl ?? PLACEHOLDER} availableImages={images} />
    </div>
  );
}
