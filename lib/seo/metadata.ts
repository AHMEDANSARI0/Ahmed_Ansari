import type { Metadata } from "next";
import type { SiteSettingsValue } from "@/lib/config/site";

export function buildMetadata({
  title,
  description,
  path,
  site,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  site: SiteSettingsValue;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const base = site.domain.replace(/\/$/, "");
  const url = `${base}${path}`;
  const ogImage = image ?? `${base}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.siteName,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}

export function personJsonLd(site: SiteSettingsValue) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.siteName,
    jobTitle: site.role,
    email: site.email,
    url: site.domain,
    address: { "@type": "PostalAddress", addressLocality: site.location },
    sameAs: site.socialLinks
      .filter((link) => link.visible && link.url.startsWith("http"))
      .map((link) => link.url),
  };
}

export function projectJsonLd({
  title,
  description,
  slug,
  domain,
  technologies,
}: {
  title: string;
  description: string;
  slug: string;
  domain: string;
  technologies: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description,
    url: `${domain.replace(/\/$/, "")}/work/${slug}`,
    keywords: technologies.join(", "),
    creator: { "@type": "Person", name: "Ahmed Ansari" },
  };
}
