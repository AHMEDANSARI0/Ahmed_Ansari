import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/services/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const base = settings.domain.replace(/\/$/, "");

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/api/health"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
