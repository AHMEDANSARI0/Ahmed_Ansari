import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { siteSettings } from "@/lib/db/schema";
import { defaultSiteSettings, type SiteSettingsValue } from "@/lib/config/site";

export const CONFIG_TAGS = {
  site: "config:site",
  design: "config:design",
  background: "config:background",
  animation: "config:animation",
  portrait: "config:portrait",
  sections: "config:sections",
  content: "content",
} as const;

export async function loadSiteSettings(): Promise<SiteSettingsValue> {
  if (!process.env.DATABASE_URL) return defaultSiteSettings;

  try {
    const db = getDb();
    const rows = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(sql`${siteSettings.key} = 'global'`)
      .limit(1);

    const stored = rows[0]?.value as Partial<SiteSettingsValue> | undefined;
    if (!stored) return defaultSiteSettings;

    return { ...defaultSiteSettings, ...stored };
  } catch {
    return defaultSiteSettings;
  }
}

export const getSiteSettings = unstable_cache(loadSiteSettings, ["site-settings"], {
  tags: [CONFIG_TAGS.site],
  revalidate: 300,
});

export async function getSiteSettingsFresh(): Promise<SiteSettingsValue> {
  return loadSiteSettings();
}

export type DesignConfigValue = import("@/lib/config/design").DesignConfig;

async function loadDesignSettings(): Promise<DesignConfigValue> {
  const { defaultDesignConfig } = await import("@/lib/config/design");
  if (!process.env.DATABASE_URL) return defaultDesignConfig;

  try {
    const db = getDb();
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(sql`${siteSettings.key} = 'design'`)
      .limit(1);

    const stored = row?.value as Partial<DesignConfigValue> | undefined;
    if (!stored) return defaultDesignConfig;

    return {
      ...defaultDesignConfig,
      ...stored,
      colors: { ...defaultDesignConfig.colors, ...stored.colors },
      typography: { ...defaultDesignConfig.typography, ...stored.typography },
      layout: { ...defaultDesignConfig.layout, ...stored.layout },
      buttons: { ...defaultDesignConfig.buttons, ...stored.buttons },
      background: { ...defaultDesignConfig.background, ...stored.background },
    };
  } catch {
    return defaultDesignConfig;
  }
}

export const getDesignSettings = unstable_cache(loadDesignSettings, ["design-settings"], {
  tags: [CONFIG_TAGS.design],
  revalidate: 300,
});

export type AnimationConfigValue = import("@/lib/config/animation").AnimationConfig;

async function loadAnimationSettings(): Promise<AnimationConfigValue> {
  const { defaultAnimationConfig } = await import("@/lib/config/animation");
  if (!process.env.DATABASE_URL) return defaultAnimationConfig;

  try {
    const db = getDb();
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(sql`${siteSettings.key} = 'animation'`)
      .limit(1);

    const stored = row?.value as Partial<AnimationConfigValue> | undefined;
    if (!stored) return defaultAnimationConfig;

    return {
      ...defaultAnimationConfig,
      ...stored,
      sections: { ...defaultAnimationConfig.sections, ...stored.sections },
    };
  } catch {
    return defaultAnimationConfig;
  }
}

export const getAnimationSettings = unstable_cache(
  loadAnimationSettings,
  ["animation-settings"],
  { tags: [CONFIG_TAGS.animation], revalidate: 300 },
);

export type PortraitConfigValue = import("@/lib/config/portrait").PortraitConfig;

async function loadPortraitSettings(): Promise<PortraitConfigValue> {
  const { defaultPortraitConfig } = await import("@/lib/config/portrait");
  if (!process.env.DATABASE_URL) return defaultPortraitConfig;

  try {
    const db = getDb();
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(sql`${siteSettings.key} = 'portrait'`)
      .limit(1);

    const stored = row?.value as Partial<PortraitConfigValue> | undefined;
    if (!stored) return defaultPortraitConfig;

    return {
      ...defaultPortraitConfig,
      ...stored,
      desktop: { ...defaultPortraitConfig.desktop, ...stored.desktop },
      mobile: { ...defaultPortraitConfig.mobile, ...stored.mobile },
    };
  } catch {
    return defaultPortraitConfig;
  }
}

export const getPortraitSettings = unstable_cache(loadPortraitSettings, ["portrait-settings"], {
  tags: [CONFIG_TAGS.portrait],
  revalidate: 300,
});
