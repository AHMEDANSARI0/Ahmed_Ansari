import type { MetadataRoute } from "next";
import { SITE_DEFAULTS } from "@/lib/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_DEFAULTS.name} — ${SITE_DEFAULTS.role}`,
    short_name: SITE_DEFAULTS.logoText,
    description:
      "AI automation engineer building intelligent agents, business automation systems and scalable digital products.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    lang: "en",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
