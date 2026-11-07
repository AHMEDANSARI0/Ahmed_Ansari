import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/services/settings";
import { getAllProjectSlugs } from "@/lib/services/projects";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, slugs] = await Promise.all([getSiteSettings(), getAllProjectSlugs()]);
  const base = settings.domain.replace(/\/$/, "");

  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/work`, changeFrequency: "monthly", priority: 0.8 },
    ...slugs.map((slug) => ({
      url: `${base}/work/${slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
